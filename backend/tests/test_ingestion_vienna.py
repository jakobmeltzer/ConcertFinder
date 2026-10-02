from datetime import datetime
from pathlib import Path
import unittest

from pydantic import ValidationError

from app.ingestion.schemas import RawConcert, RawProgrammeItem
from app.ingestion.sources.vienna_philharmonic import discover_event_urls, parse_event_page
from app.ingestion.validation import IngestionValidationError, validate_raw_concert

FIXTURES = Path(__file__).parent / "fixtures" / "ingestion"


class ViennaCrawlerTests(unittest.TestCase):
    def test_discovers_unique_internal_event_urls(self):
        html = (FIXTURES / "vienna_calendar.html").read_text()
        self.assertEqual(
            discover_event_urls(html),
            ["https://www.wienerphilharmoniker.at/en/konzerte/concert-of-the-society-of-friends-of-music-in-vienna/10892/"],
        )

    def test_parses_raw_concert_without_database(self):
        html = (FIXTURES / "vienna_event.html").read_text()
        concert = parse_event_page(
            html,
            "https://www.wienerphilharmoniker.at/en/konzerte/concert-of-the-society-of-friends-of-music-in-vienna/10892/",
            crawled_at=datetime.fromisoformat("2026-09-24T12:00:00+00:00"),
        )
        validate_raw_concert(concert)
        self.assertEqual(concert.source_event_id, "10892")
        self.assertEqual(concert.date.isoformat(), "2026-09-25")
        self.assertEqual(concert.time.isoformat(), "19:30:00")
        self.assertEqual(concert.timezone, "Europe/Vienna")
        self.assertEqual(concert.venue, "Musikverein, Golden Hall")
        self.assertEqual(concert.city, "Vienna")
        self.assertEqual(concert.country, "Austria")
        self.assertEqual(concert.conductor, "Esa-Pekka Salonen")
        self.assertEqual(concert.orchestra, "Vienna Philharmonic")
        self.assertEqual(len(concert.programme), 3)
        self.assertEqual(concert.programme[2].raw_composer, "Jean Sibelius")
        self.assertEqual(concert.programme[2].raw_work, "Symphony No. 5 in E flat major, op. 82")

    def test_parses_saved_live_lucerne_page(self):
        html = (FIXTURES / "vienna_live_10920.html").read_text()
        concert = parse_event_page(
            html,
            "https://www.wienerphilharmoniker.at/en/konzerte/concert-in-lucerne/10920/",
            crawled_at=datetime.fromisoformat("2026-09-24T12:00:00+00:00"),
        )
        validate_raw_concert(concert)
        self.assertEqual(concert.orchestra, "Vienna Philharmonic")
        self.assertEqual(concert.timezone, "Europe/Zurich")
        self.assertEqual(concert.ticket_url, None)
        self.assertEqual(
            [(item.raw_composer, item.raw_work) for item in concert.programme],
            [
                ("Wolfgang Amadeus Mozart", "Symphony [No. 25] in G Minor, K. 183"),
                ("Gustav Mahler", "Symphony No. 1 in D Major"),
            ],
        )

    def test_unknown_touring_timezone_is_not_assumed_vienna(self):
        html = (FIXTURES / "vienna_live_10920.html").read_text().replace(
            "Lucerne, Switzerland", "Unknown City, Unknown Country"
        )
        concert = parse_event_page(
            html,
            "https://www.wienerphilharmoniker.at/en/konzerte/example/99999/",
        )
        self.assertIsNone(concert.timezone)
        with self.assertRaises(IngestionValidationError):
            validate_raw_concert(concert)

    def test_programme_order_must_be_unique_and_contiguous(self):
        with self.assertRaises(ValidationError):
            RawConcert(
                source="test", source_url="https://example.com/event/1",
                crawled_at=datetime.now().astimezone(), date=datetime.now().date(),
                venue="Hall", city="Vienna", country="Austria",
                programme=[
                    RawProgrammeItem(order=1, raw_work="A"),
                    RawProgrammeItem(order=3, raw_work="B"),
                ],
            )

    def test_time_requires_timezone(self):
        concert = RawConcert(
            source="test", source_url="https://example.com/event/1",
            crawled_at=datetime.now().astimezone(), date=datetime.now().date(),
            time=datetime.now().time().replace(microsecond=0),
            venue="Hall", city="Vienna", country="Austria",
        )
        with self.assertRaises(IngestionValidationError):
            validate_raw_concert(concert)


if __name__ == "__main__":
    unittest.main()
