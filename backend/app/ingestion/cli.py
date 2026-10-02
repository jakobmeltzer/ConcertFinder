from __future__ import annotations

import argparse
import json
import os
import sys
from contextlib import ExitStack
from pathlib import Path
from uuid import uuid4

from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.ingestion.import_service import apply_import, plan_import
from app.ingestion.normalization import normalize_text
from app.ingestion.catalog import SQLAlchemyCatalog
from app.ingestion.resolution import resolve_concert
from app.ingestion.sources.vienna_philharmonic import crawl
from app.models import IngestionAlias, Work
from app.ingestion.review import collect_review_items, review_items
from app.ingestion.llm import OpenAIMetadataReviewer, review_metadata


def _resolution_json(resolution, plan):
    def entity(r):
        if r is None:
            return None
        return {
            "raw": r.raw_value, "status": r.status, "canonical_id": r.canonical_id,
            "method": r.method,
            "candidates": [{"id": c.id, "label": c.label, "score": c.score} for c in r.candidates],
        }
    return {
        "source_event_id": resolution.raw.source_event_id,
        "title": resolution.raw.title,
        "status": "ready-to-import" if resolution.ready_to_import else "blocked-unresolved",
        "plan": {"action": plan.action, "concert_id": plan.concert_id, "reason": plan.reason},
        "orchestra": entity(resolution.orchestra),
        "venue": entity(resolution.venue),
        "conductor": entity(resolution.conductor),
        "programme": [
            {"order": p.order, "composer": entity(p.composer), "work": entity(p.work)}
            for p in resolution.programme
        ],
    }


def resolve_vienna(
    limit: int, write: bool, *, llm: bool = False,
    model: str | None = None, report_path: str | None = None,
) -> int:
    reviewer = OpenAIMetadataReviewer(model=model) if llm else None
    output = []
    blocked = 0
    with ExitStack() as stack:
        # Persist the source and review before committing LLM-assisted writes.
        # Exclusive creation prevents accidentally overwriting an earlier audit.
        if reviewer and write and not report_path:
            folder = Path(__file__).resolve().parents[2] / "ingestion_reports"
            folder.mkdir(exist_ok=True)
            report_path = str(folder / f"{uuid4().hex}.json")
        report_file = stack.enter_context(open(report_path, "x", encoding="utf-8")) if report_path else None
        raw_concerts = crawl(limit=limit, validate=False) if reviewer else crawl(limit=limit)
        # Finish external requests before opening a database transaction.
        reviewed = [
            (raw, review_metadata(raw, reviewer) if reviewer else None)
            for raw in raw_concerts
        ]
        db = stack.enter_context(SessionLocal())
        catalog = SQLAlchemyCatalog(db)
        for raw, metadata_review in reviewed:
            if metadata_review and metadata_review.corrected is None:
                blocked += 1
                output.append({
                    "source_event_id": raw.source_event_id,
                    "title": raw.title,
                    "status": "blocked-metadata",
                    "plan": {"action": "blocked", "concert_id": None,
                             "reason": "; ".join(metadata_review.issues)},
                    "metadata_review": metadata_review.model_dump(mode="json"),
                })
                continue
            if metadata_review:
                raw = metadata_review.corrected
            resolution = resolve_concert(raw, catalog)
            plan = plan_import(db, resolution)
            record = _resolution_json(resolution, plan)
            if metadata_review:
                record["metadata_review"] = metadata_review.model_dump(mode="json")
            output.append(record)
            if plan.action == "blocked":
                blocked += 1
                continue
            if write:
                apply_import(db, resolution, plan)
        if report_file:
            json.dump(output, report_file, indent=2, ensure_ascii=False)
            report_file.write("\n")
            report_file.flush()
            os.fsync(report_file.fileno())
        if write:
            db.commit()
        else:
            db.rollback()
    if report_path:
        print(f"Ingestion review report: {report_path}", file=sys.stderr)
    print(json.dumps(output, indent=2, ensure_ascii=False))
    return 2 if blocked else 0


def add_alias(entity_type: str, entity_id: str, alias: str, source: str | None) -> int:
    if entity_type not in {"orchestra", "venue", "conductor", "composer", "work"}:
        raise SystemExit("invalid entity type")
    with SessionLocal() as db:
        catalog = SQLAlchemyCatalog(db)
        if not catalog.target_exists(entity_type, entity_id):
            raise SystemExit(f"canonical {entity_type} does not exist: {entity_id}")
        context_id = ""
        if entity_type == "work":
            work = db.get(Work, entity_id)
            context_id = work.composer_id
        row = IngestionAlias(entity_type=entity_type, entity_id=entity_id, alias=alias,
                             normalized_alias=normalize_text(alias), context_id=context_id, source=source)
        db.add(row)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise SystemExit(f"alias already exists for this entity type: {alias!r}") from exc
    print(f"Added {entity_type} alias {alias!r} -> {entity_id}")
    return 0

def review_vienna(limit: int) -> int:
    raw_concerts = crawl(limit=limit)

    with SessionLocal() as db:
        catalog = SQLAlchemyCatalog(db)

        resolutions = [
            resolve_concert(raw, catalog)
            for raw in raw_concerts
        ]

        items = collect_review_items(resolutions)

        review_items(db, items)

    print(
        "\nReview decisions saved.\n"
        "Run the resolver again to see what remains:\n\n"
        f"  .venv/bin/python -m app.ingestion.cli vienna --limit {limit}\n"
    )

    return 0


def main():
    parser = argparse.ArgumentParser(description="ConcertFinder ingestion resolution/import tools")
    sub = parser.add_subparsers(dest="command", required=True)

    resolve = sub.add_parser("vienna", help="crawl Vienna Philharmonic and resolve against canonical DB")
    resolve.add_argument("--limit", type=int, default=5)
    resolve.add_argument("--write", action="store_true", help="apply only fully resolved insert/update plans")
    resolve.add_argument("--llm", action="store_true", help="review metadata against page evidence before resolving")
    resolve.add_argument("--model", help="OpenAI model; defaults to INGESTION_LLM_MODEL")
    resolve.add_argument("--report", help="save JSON review and import plans to a new file")
    review = sub.add_parser(
        "review-vienna",
        help="interactively review unresolved Vienna Philharmonic entities",
    )
    review.add_argument("--limit", type=int, default=5)

    alias = sub.add_parser("add-alias", help="add a human-approved canonical alias")
    alias.add_argument("entity_type", choices=["orchestra", "venue", "conductor", "composer", "work"])
    alias.add_argument("entity_id")
    alias.add_argument("alias")
    alias.add_argument("--source")

    args = parser.parse_args()
    if args.command == "vienna":
        if args.model and not args.llm:
            parser.error("--model requires --llm")
        try:
            result = resolve_vienna(
                args.limit, args.write, llm=args.llm,
                model=args.model, report_path=args.report,
            )
        except (ValueError, OSError, ImportError) as exc:
            parser.exit(2, f"Ingestion failed: {exc}\n")
        raise SystemExit(
            result
        )

    if args.command == "review-vienna":
        raise SystemExit(
            review_vienna(args.limit)
        )

    if args.command == "add-alias":
        raise SystemExit(
            add_alias(
                args.entity_type,
                args.entity_id,
                args.alias,
                args.source,
            )
        )

    raise SystemExit("unknown command")


if __name__ == "__main__":
    main()
