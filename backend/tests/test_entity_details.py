"""Integration tests against the migrated local database; all writes roll back."""
import unittest
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.database import engine
from app.models import Composer, Work
from app.routers.composers import get_composer
from app.schemas.composer_detail import ComposerDetailResponse


class EntityDetailTests(unittest.TestCase):
    def setUp(self):
        self.connection = engine.connect()
        self.transaction = self.connection.begin()
        self.db = Session(bind=self.connection)

    def tearDown(self):
        self.db.close()
        self.transaction.rollback()
        self.connection.close()

    def test_composer_works_and_distinct_sorted_concerts(self):
        detail = ComposerDetailResponse.model_validate(get_composer('gustav-mahler', self.db))
        self.assertEqual(len(detail.works), 3)
        self.assertTrue(all(w.composer.id == detail.id for w in detail.works))
        self.assertEqual(len(detail.performances), 6)
        keys = [(p.date, p.time, p.id) for p in detail.performances]
        self.assertEqual(keys, sorted(set(keys)))

    def test_canonical_identity_is_not_derived_from_name(self):
        composer = Composer(id='composer-test-123', name='A name unrelated to the ID')
        self.db.add(composer)
        self.db.flush()
        detail = ComposerDetailResponse.model_validate(get_composer(composer.id, self.db))
        self.assertEqual(detail.works, [])
        self.assertEqual(detail.performances, [])
        self.db.add(Work(id='work-test-456', title='Different title', composer_id=composer.id))
        composer.name = 'Renamed composer'
        self.db.flush()
        detail = ComposerDetailResponse.model_validate(get_composer(composer.id, self.db))
        self.assertEqual(detail.works[0].id, 'work-test-456')
        self.assertEqual(detail.id, 'composer-test-123')

    def test_missing_composer(self):
        with self.assertRaises(HTTPException) as error:
            get_composer('not-an-existing-composer', self.db)
        self.assertEqual(error.exception.status_code, 404)

    def test_concert_programme_preserves_metadata_and_order(self):
        from app.routers.concerts import get_concert
        from app.schemas.concert import ConcertResponse
        from app.models import ProgrammeItem, Concert
        concert = self.db.get(Concert, 'berlin-mahler-1-2-2026-09-27')
        concert.ticket_url = 'https://example.org/tickets'
        concert.source_url = 'https://example.org/concert'
        self.db.add(ProgrammeItem(concert_id=concert.id, work_id='mahler-symphony-no-1', programme_order=3))
        self.db.flush()
        detail = ConcertResponse.model_validate(get_concert(concert.id, self.db))
        self.assertEqual([i.order for i in detail.programme], [1, 2, 3])
        self.assertEqual([i.work.id for i in detail.programme], ['mahler-symphony-no-1', 'mahler-symphony-no-2', 'mahler-symphony-no-1'])
        self.assertTrue(all(i.work.year and i.work.duration for i in detail.programme))
        self.assertEqual(detail.orchestra.id, 'berlin-philharmonic')
        self.assertEqual(detail.ticket_url, 'https://example.org/tickets')
        self.assertEqual(detail.source_url, 'https://example.org/concert')

    def test_concert_nullable_conductor_and_unknown_id(self):
        from app.routers.concerts import get_concert
        from app.schemas.concert import ConcertResponse
        detail = ConcertResponse.model_validate(get_concert('vienna-mahler-2-2026-09-18', self.db))
        self.assertIsNone(detail.conductor)
        with self.assertRaises(HTTPException) as error:
            get_concert('vienna-philharmonic-mahler-2-2026-09-18', self.db)
        self.assertEqual(error.exception.status_code, 404)
