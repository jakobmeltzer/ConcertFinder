import copy
import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

from app.ingestion.cli import resolve_vienna
from app.ingestion.import_service import ImportPlan, apply_import
from app.ingestion.llm import (
    MAX_SOURCE_CHARACTERS, Metadata, OpenAIMetadataReviewer, ProviderResult,
    ReviewDecision, review_metadata,
)
from app.ingestion.resolution import resolve_concert
from app.ingestion.sources.vienna_philharmonic import parse_event_page
from tests.test_ingestion_resolution import FakeCatalog, raw


def source_record():
    record = raw()
    metadata = {key: value for key, value in record.model_dump(mode="json").items()
                if key in Metadata.model_fields}
    # Independent evidence as a small event page would supply it.
    record.source_text = "\n".join([
        "Concert in Lucerne", "2026-09-05 18:30:00", "Europe/Zurich",
        "Lucerne Culture and Congress Centre", "Lucerne", "Switzerland",
        "Vienna Philharmonic", "Tugan Sokhiev", "Gustav Mahler", "Symphony No. 1",
    ])
    evidence = [
        {"field": key, "quotes": [value]}
        for key, value in metadata.items() if isinstance(value, str)
    ]
    evidence.append({"field": "programme", "quotes": ["Gustav Mahler", "Symphony No. 1"]})
    decision = ReviewDecision.model_validate({
        "verdict": "verified", "metadata": metadata, "evidence": evidence, "issues": [],
    })
    reviewer = Mock(model="test-model")
    reviewer.review.return_value = ProviderResult(decision=decision, response_id="resp_test")
    return record, decision, reviewer


class MetadataReviewTests(unittest.TestCase):
    def test_verified_record_preserves_identity_and_programme(self):
        record, _, reviewer = source_record()
        result = review_metadata(record, reviewer)
        self.assertEqual(result.status, "verified")
        self.assertEqual(result.corrected, record)
        self.assertEqual(result.response_id, "resp_test")
        self.assertEqual(len(result.source_sha256), 64)

    def test_repairs_parser_error_without_mutating_original(self):
        record, _, reviewer = source_record()
        record.conductor = "Navigation text"
        result = review_metadata(record, reviewer)
        self.assertEqual(result.status, "corrected")
        self.assertEqual(result.changed_fields, ["conductor"])
        self.assertEqual(result.corrected.conductor, "Tugan Sokhiev")
        self.assertEqual(record.conductor, "Navigation text")
        self.assertEqual(result.corrected.source_event_id, record.source_event_id)

    def test_uncertain_or_conflicting_review_blocks(self):
        for verdict, issues in [("needs-review", []), ("verified", ["Dates conflict"])]:
            with self.subTest(verdict=verdict):
                record, decision, reviewer = source_record()
                decision.verdict, decision.issues = verdict, issues
                result = review_metadata(record, reviewer)
                self.assertEqual(result.status, "needs-review")
                self.assertIsNone(result.corrected)

    def test_missing_or_oversized_evidence_never_calls_provider(self):
        for source in [None, " ", "a" * (MAX_SOURCE_CHARACTERS + 1)]:
            record, _, reviewer = source_record()
            record.source_text = source
            result = review_metadata(record, reviewer)
            self.assertEqual(result.status, "error")
            reviewer.review.assert_not_called()

    def test_invalid_reviews_fail_closed(self):
        changes = {
            "invented quote": lambda d: setattr(d.evidence[0], "quotes", ["invented"]),
            "missing evidence": lambda d: d.evidence.pop(),
            "wrong conductor": lambda d: setattr(d.metadata, "conductor", "Someone else"),
            "bad timezone": lambda d: setattr(d.metadata, "timezone", "Invalid/Zone"),
            "empty programme": lambda d: setattr(d.metadata, "programme", []),
            "duplicate order": lambda d: d.metadata.programme.append(copy.deepcopy(d.metadata.programme[0])),
            "wrong composer": lambda d: setattr(d.metadata.programme[0], "raw_composer", "Invented"),
            "bad date": lambda d: setattr(d.metadata, "date", "tomorrow"),
            "removed conductor": lambda d: setattr(d.metadata, "conductor", None),
            "invented URL": lambda d: setattr(d.metadata, "ticket_url", "https://evil.test"),
            "duplicate evidence": lambda d: d.evidence.append(copy.deepcopy(d.evidence[0])),
        }
        for label, change in changes.items():
            with self.subTest(label=label):
                record, decision, reviewer = source_record()
                change(decision)
                result = review_metadata(record, reviewer)
                self.assertEqual(result.status, "needs-review")
                self.assertIsNone(result.corrected)

    def test_timeout_is_blocked_and_error_details_are_not_exposed(self):
        record, _, reviewer = source_record()
        reviewer.review.side_effect = TimeoutError("secret provider error body")
        result = review_metadata(record, reviewer)
        self.assertEqual(result.status, "error")
        self.assertNotIn("secret", result.model_dump_json())

    def test_schema_cannot_override_identity(self):
        _, decision, _ = source_record()
        payload = decision.model_dump()
        payload["metadata"]["source_event_id"] = "different"
        with self.assertRaises(ValueError):
            ReviewDecision.model_validate(payload)

    def test_crawler_retains_visible_evidence_and_resolved_ticket_link(self):
        html = (Path(__file__).parent / "fixtures/ingestion/vienna_event.html").read_text()
        record = parse_event_page(html, "https://www.wienerphilharmoniker.at/en/konzerte/example/10892/")
        self.assertIn("Symphonie Nr. 4", record.source_text)
        self.assertIn("https://www.wienerphilharmoniker.at/tickets/10892", record.source_text)


class OpenAIProviderTests(unittest.TestCase):
    def test_real_sdk_serializes_schema_and_parses_response_without_network(self):
        import httpx
        from openai import OpenAI

        record, decision, _ = source_record()
        requests = []

        def respond(request):
            requests.append(json.loads(request.content))
            return httpx.Response(200, json={
                "id": "resp_test", "object": "response", "created_at": 1,
                "model": "test-model", "status": "completed", "error": None,
                "incomplete_details": None, "instructions": None,
                "metadata": {}, "parallel_tool_calls": False, "tools": [],
                "tool_choice": "auto", "temperature": 1, "top_p": 1,
                "output": [{"id": "msg_test", "type": "message", "role": "assistant",
                            "status": "completed", "content": [{"type": "output_text",
                            "text": decision.model_dump_json(), "annotations": []}]}],
            })

        with OpenAI(api_key="test-only", http_client=httpx.Client(
            transport=httpx.MockTransport(respond),
        )) as client:
            result = review_metadata(record, OpenAIMetadataReviewer(model="test-model", client=client))
        self.assertEqual(result.status, "verified")
        schema = requests[0]["text"]["format"]
        self.assertTrue(schema["strict"])
        self.assertEqual(schema["type"], "json_schema")
        self.assertFalse(schema["schema"]["additionalProperties"])

    def test_structured_response_uses_untrusted_input_and_no_storage(self):
        record, decision, _ = source_record()
        client = Mock()
        client.responses.parse.return_value = SimpleNamespace(
            status="completed", output_parsed=decision, id="resp_test",
        )
        provider = OpenAIMetadataReviewer(model="chosen-model", client=client)
        self.assertEqual(provider.review(record).decision, decision)
        kwargs = client.responses.parse.call_args.kwargs
        self.assertFalse(kwargs["store"])
        self.assertIs(kwargs["text_format"], ReviewDecision)
        self.assertEqual(kwargs["model"], "chosen-model")
        self.assertEqual(json.loads(kwargs["input"])["source_text"], record.source_text)

    def test_refusal_and_incomplete_responses_block(self):
        record, decision, _ = source_record()
        for status, parsed in [("completed", None), ("incomplete", decision)]:
            client = Mock()
            client.responses.parse.return_value = SimpleNamespace(status=status, output_parsed=parsed)
            result = review_metadata(record, OpenAIMetadataReviewer(model="test", client=client))
            self.assertIsNone(result.corrected)

    @patch.dict(os.environ, {}, clear=True)
    def test_missing_configuration_fails_before_any_request(self):
        with self.assertRaisesRegex(ValueError, "INGESTION_LLM_MODEL"):
            OpenAIMetadataReviewer()
        with self.assertRaisesRegex(ValueError, "OPENAI_API_KEY"):
            OpenAIMetadataReviewer(model="test")


class LLMImportTests(unittest.TestCase):
    def run_cli(self, record, reviewer, *, write=False, report_path=None, audit_failure=False):
        db = Mock()
        session = Mock()
        session.__enter__ = Mock(return_value=db)
        session.__exit__ = Mock(return_value=False)
        with (
            patch("app.ingestion.cli.OpenAIMetadataReviewer", return_value=reviewer),
            patch("app.ingestion.cli.crawl", return_value=[record]),
            patch("app.ingestion.cli.SessionLocal", return_value=session),
            patch("app.ingestion.cli.SQLAlchemyCatalog", return_value=FakeCatalog()),
            patch("app.ingestion.cli.plan_import", side_effect=lambda db, resolution:
                  ImportPlan("insert", "test", "new") if resolution.ready_to_import
                  else ImportPlan("blocked", None, "unresolved")) as plan,
            patch("app.ingestion.cli.apply_import") as apply,
            patch("app.ingestion.cli.os.fsync", side_effect=OSError("disk failure") if audit_failure else None),
            redirect_stdout(io.StringIO()) as stdout,
        ):
            if audit_failure:
                with self.assertRaisesRegex(OSError, "disk failure"):
                    resolve_vienna(1, write, llm=True, report_path=report_path)
                db.commit.assert_not_called()
                return
            code = resolve_vienna(1, write, llm=True, report_path=report_path)
        return code, json.loads(stdout.getvalue()), db, plan, apply

    def test_dry_run_reviews_and_resolves_but_does_not_write(self):
        record, _, reviewer = source_record()
        code, output, db, plan, apply = self.run_cli(record, reviewer)
        self.assertEqual(code, 0)
        self.assertEqual(output[0]["status"], "ready-to-import")
        apply.assert_not_called()
        db.commit.assert_not_called()
        db.rollback.assert_called_once()
        plan.assert_called_once()

    def test_blocked_metadata_never_reaches_resolver_or_importer(self):
        record, decision, reviewer = source_record()
        decision.verdict = "needs-review"
        code, output, _, plan, apply = self.run_cli(record, reviewer)
        self.assertEqual(code, 2)
        self.assertEqual(output[0]["status"], "blocked-metadata")
        plan.assert_not_called()
        apply.assert_not_called()

    def test_write_uses_corrected_metadata_and_saves_audit(self):
        record, _, reviewer = source_record()
        record.conductor = "Wrong name"
        with tempfile.TemporaryDirectory() as folder:
            path = str(Path(folder) / "report.json")
            code, output, db, _, apply = self.run_cli(record, reviewer, write=True, report_path=path)
            self.assertEqual(json.loads(Path(path).read_text()), output)
        self.assertEqual(code, 0)
        self.assertEqual(apply.call_args.args[1].raw.conductor, "Tugan Sokhiev")
        db.commit.assert_called_once()

    def test_source_verified_work_still_requires_canonical_match(self):
        record, decision, reviewer = source_record()
        record.source_text = record.source_text.replace("Symphony No. 1", "Unknown work")
        record.programme[0].raw_work = "Unknown work"
        decision.metadata.programme[0].raw_work = "Unknown work"
        decision.evidence[-1].quotes = ["Gustav Mahler", "Unknown work"]
        code, output, _, _, apply = self.run_cli(record, reviewer)
        self.assertEqual(code, 2)
        self.assertEqual(output[0]["status"], "blocked-unresolved")
        apply.assert_not_called()

    def test_audit_failure_prevents_commit(self):
        record, _, reviewer = source_record()
        with tempfile.TemporaryDirectory() as folder:
            self.run_cli(record, reviewer, write=True,
                         report_path=str(Path(folder) / "report.json"), audit_failure=True)

    def test_forged_plan_cannot_import_unresolved_entities(self):
        resolution = resolve_concert(raw(work="Unknown work"), FakeCatalog())
        db = Mock()
        with self.assertRaisesRegex(ValueError, "not import-ready"):
            apply_import(db, resolution, ImportPlan("insert", "bad", "forged"))
        db.add.assert_not_called()


if __name__ == "__main__":
    unittest.main()
