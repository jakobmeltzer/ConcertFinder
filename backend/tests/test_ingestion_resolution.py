import unittest
from datetime import date, datetime, time, timezone

from app.ingestion.normalization import normalize_text
from app.ingestion.resolution import resolve_concert
from app.ingestion.schemas import RawConcert, RawProgrammeItem


class FakeCatalog:
    def __init__(self):
        self.named = {
            "orchestra": [("vienna-philharmonic", "Vienna Philharmonic")],
            "conductor": [("tugan-sokhiev", "Tugan Sokhiev")],
            "composer": [("gustav-mahler", "Gustav Mahler"), ("sergei-prokofiev", "Sergei Prokofiev")],
        }
        self.venue_rows = [("kkl-lucerne", "Lucerne Culture and Congress Centre", "Lucerne", "Switzerland")]
        self.works = {
            "gustav-mahler": [("mahler-symphony-no-1", "Symphony No. 1")],
            "sergei-prokofiev": [("prokofiev-romeo-juliet-suite", "Romeo and Juliet Suite")],
        }
        self.aliases = {}

    def rows(self, entity_type): return self.named[entity_type]
    def venues(self): return self.venue_rows
    def works_for_composer(self, composer_id): return self.works.get(composer_id, [])
    def alias_target(self, entity_type, normalized_alias, context_id=""): return self.aliases.get((entity_type, context_id, normalized_alias))
    def target_exists(self, entity_type, entity_id):
        if entity_type == "venue": return any(r[0] == entity_id for r in self.venue_rows)
        if entity_type == "work": return any(i == entity_id for rows in self.works.values() for i, _ in rows)
        return any(i == entity_id for i, _ in self.named[entity_type])


def raw(work="Symphony No. 1", composer="Gustav Mahler"):
    return RawConcert(source="vienna-philharmonic", source_event_id="10920",
        source_url="https://example.test/event/10920", crawled_at=datetime.now(timezone.utc),
        title="Concert in Lucerne", date=date(2026, 9, 5), time=time(18, 30), timezone="Europe/Zurich",
        venue="Lucerne Culture and Congress Centre", city="Lucerne", country="Switzerland",
        orchestra="Vienna Philharmonic", conductor="Tugan Sokhiev",
        programme=[RawProgrammeItem(order=1, raw_composer=composer, raw_work=work)])


class ResolutionTests(unittest.TestCase):
    def test_normalization_is_accent_and_punctuation_insensitive(self):
        self.assertEqual(normalize_text("Antonín Dvořák"), "antonin dvorak")

    def test_exact_resolution_becomes_ready(self):
        result = resolve_concert(raw(), FakeCatalog())
        self.assertTrue(result.ready_to_import)
        self.assertEqual(result.programme[0].work.canonical_id, "mahler-symphony-no-1")

    def test_fuzzy_candidate_never_auto_matches(self):
        result = resolve_concert(raw(work="Symphony No. 1 in D Major"), FakeCatalog())
        self.assertFalse(result.ready_to_import)
        self.assertEqual(result.programme[0].work.status, "unresolved")
        self.assertEqual(result.programme[0].work.candidates[0].id, "mahler-symphony-no-1")

    def test_human_alias_can_resolve_language_variant(self):
        catalog = FakeCatalog()
        catalog.aliases[("composer", "", normalize_text("Sergej Prokofieff"))] = "sergei-prokofiev"
        catalog.aliases[("work", "sergei-prokofiev", normalize_text('Suite aus dem Ballett "Romeo und Julia"'))] = "prokofiev-romeo-juliet-suite"
        result = resolve_concert(raw(work='Suite aus dem Ballett "Romeo und Julia"', composer="Sergej Prokofieff"), catalog)
        self.assertTrue(result.ready_to_import)
        self.assertEqual(result.programme[0].composer.method, "alias")
        self.assertEqual(result.programme[0].work.method, "alias")


if __name__ == "__main__":
    unittest.main()
