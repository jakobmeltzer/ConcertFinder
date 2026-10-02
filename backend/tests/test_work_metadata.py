"""Integration tests: run after migration/seed with python -m unittest discover -s tests."""
import json
from pathlib import Path
import unittest

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import engine
from app.models import Instrument, ProgrammeItem, Work, WorkInstrument
from app.routers.works import get_work, get_works
from app.schemas.work import WorkDetailResponse, WorkResponse
from seed_work_metadata import seed_work_metadata


class WorkMetadataTests(unittest.TestCase):
    def setUp(self):
        self.connection = engine.connect()
        self.transaction = self.connection.begin()
        self.db = Session(bind=self.connection)

    def tearDown(self):
        self.db.close()
        self.transaction.rollback()
        self.connection.close()

    def test_preserves_all_source_metadata_and_order(self):
        records = json.loads((Path(__file__).parents[1] / "seed_data/work_metadata.json").read_text())
        for record in records:
            work = WorkDetailResponse.model_validate(get_work(record["id"], self.db))
            self.assertEqual(work.description, record["description"])
            self.assertEqual(work.about, record["about"])
            self.assertEqual(work.instrumentation_summary, record["instrumentation_summary"])
            self.assertEqual(
                [{"name": group.name, "instruments": [i.display_label for i in group.instruments]} for group in work.instrumentation],
                record["instrumentation"],
            )
            self.assertEqual([w.id for w in work.related_works], record["related_work_ids"])
            for related in work.related_works:
                self.assertEqual(get_work(related.id, self.db)["id"], related.id)

    def test_queryable_instruments_and_unknown_quantities(self):
        organ_works = self.db.scalars(select(WorkInstrument.work_id).join(Instrument).where(Instrument.name == "Organ")).all()
        self.assertEqual(organ_works, ["mahler-symphony-no-2"])
        choir_works = set(self.db.scalars(select(WorkInstrument.work_id).join(Instrument).where(Instrument.name.ilike("%choir%"))))
        self.assertEqual(choir_works, {"mahler-symphony-no-2", "beethoven-symphony-no-9"})
        self.assertEqual(self.db.get(WorkInstrument, ("mahler-symphony-no-2", "woodwinds-flute")).quantity, 4)
        self.assertIsNone(self.db.get(WorkInstrument, ("mahler-symphony-no-2", "strings-1st-violins")).quantity)

    def test_light_list_and_missing_work(self):
        for work in get_works(self.db):
            self.assertNotIn("instrumentation", WorkResponse.model_validate(work).model_dump())
        with self.assertRaises(HTTPException) as error:
            get_work("missing-metadata-test", self.db)
        self.assertEqual(error.exception.status_code, 404)

    def test_deduplicated_sorted_performances(self):
        original = self.db.scalars(select(ProgrammeItem).where(ProgrammeItem.work_id == "mahler-symphony-no-2")).first()
        self.db.add(ProgrammeItem(work_id=original.work_id, concert_id=original.concert_id, programme_order=99))
        self.db.flush()
        detail = WorkDetailResponse.model_validate(get_work(original.work_id, self.db))
        performances = detail.performances
        self.assertEqual(len(performances), len({p.id for p in performances}))
        self.assertEqual([(p.date, p.time, p.id) for p in performances], sorted((p.date, p.time, p.id) for p in performances))

    def test_empty_metadata_and_repeatable_seed(self):
        self.db.add(Work(id="metadata-test-empty", composer_id="gustav-mahler", title="Test only"))
        self.db.flush()
        detail = WorkDetailResponse.model_validate(get_work("metadata-test-empty", self.db))
        self.assertEqual(detail.about, [])
        self.assertEqual(detail.instrumentation, [])
        self.assertEqual(detail.related_works, [])
        self.assertIsNone(detail.instrumentation_summary)
        seed_work_metadata(self.db)
        seed_work_metadata(self.db)
        self.test_preserves_all_source_metadata_and_order()


if __name__ == "__main__":
    unittest.main()
