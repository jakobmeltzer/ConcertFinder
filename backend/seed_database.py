from datetime import date, time

from app.database import SessionLocal
from app.models import (
    Composer,
    Work,
    Orchestra,
    Venue,
    Conductor,
    Concert,
    ProgrammeItem,
)


def seed_database():
    db = SessionLocal()

    try:
        print("Seeding database...")

        # ---------------------------------------------------------
        # Composers
        # ---------------------------------------------------------

        composers = [
            Composer(
                id="gustav-mahler",
                name="Gustav Mahler",
                birth_year=1860,
                death_year=1911,
                period="Late Romantic",
                description=(
                    "Gustav Mahler was an Austrian composer and conductor whose "
                    "symphonies combine large-scale orchestral forces with deeply "
                    "personal and dramatic musical expression."
                ),
            ),
            Composer(
                id="anton-bruckner",
                name="Anton Bruckner",
                birth_year=1824,
                death_year=1896,
                period="Late Romantic",
                description=(
                    "Anton Bruckner was an Austrian composer known especially for "
                    "his expansive symphonies, monumental orchestration, and "
                    "strong connection to sacred music."
                ),
            ),
            Composer(
                id="ludwig-van-beethoven",
                name="Ludwig van Beethoven",
                birth_year=1770,
                death_year=1827,
                period="Classical / Romantic",
                description=(
                    "Ludwig van Beethoven was a German composer whose work played "
                    "a central role in the transition from the Classical period "
                    "to the Romantic era."
                ),
            ),
        ]

        db.add_all(composers)

        # ---------------------------------------------------------
        # Works
        # ---------------------------------------------------------

        works = [
            Work(
                id="mahler-symphony-no-2",
                composer_id="gustav-mahler",
                title="Symphony No. 2",
                subtitle="Resurrection",
                year="1888–1894",
                period="Late Romantic",
                duration="80–90 minutes",
                premiered="1895",
                description=(
                    "Mahler's monumental Second Symphony explores death, "
                    "resurrection, and the possibility of transcendence."
                ),
            ),
            Work(
                id="mahler-symphony-no-1",
                composer_id="gustav-mahler",
                title="Symphony No. 1",
                subtitle="Titan",
                year="1887–1888",
                period="Late Romantic",
                duration="50–55 minutes",
                premiered="1889",
                description=(
                    "Mahler's First Symphony combines folk-like melodies, "
                    "nature imagery, and dramatic orchestral writing."
                ),
            ),
            Work(
                id="mahler-symphony-no-5",
                composer_id="gustav-mahler",
                title="Symphony No. 5",
                year="1901–1902",
                period="Late Romantic",
                duration="65–75 minutes",
                premiered="1904",
                description=(
                    "Mahler's Fifth Symphony moves from a funeral march through "
                    "dramatic conflict toward an energetic and affirmative finale."
                ),
            ),
            Work(
                id="bruckner-symphony-no-7",
                composer_id="anton-bruckner",
                title="Symphony No. 7",
                year="1881–1883",
                period="Late Romantic",
                duration="65–70 minutes",
                premiered="1884",
                description=(
                    "Bruckner's Seventh Symphony is one of his most celebrated "
                    "works, known for its expansive architecture and profound "
                    "Adagio."
                ),
            ),
            Work(
                id="beethoven-symphony-no-9",
                composer_id="ludwig-van-beethoven",
                title="Symphony No. 9",
                subtitle="Choral",
                year="1822–1824",
                period="Classical / Romantic",
                duration="65–75 minutes",
                premiered="1824",
                description=(
                    "Beethoven's Ninth Symphony culminates in a monumental choral "
                    "finale based on Friedrich Schiller's Ode to Joy."
                ),
            ),
        ]

        db.add_all(works)

        # ---------------------------------------------------------
        # Orchestras
        # ---------------------------------------------------------

        orchestras = [
            Orchestra(
                id="vienna-philharmonic",
                name="Vienna Philharmonic",
                city="Vienna",
                country="Austria",
                website="https://www.wienerphilharmoniker.at/",
            ),
            Orchestra(
                id="berlin-philharmonic",
                name="Berlin Philharmonic",
                city="Berlin",
                country="Germany",
                website="https://www.berliner-philharmoniker.de/",
            ),
            Orchestra(
                id="royal-concertgebouw-orchestra",
                name="Royal Concertgebouw Orchestra",
                city="Amsterdam",
                country="Netherlands",
                website="https://www.concertgebouworkest.nl/",
            ),
        ]

        db.add_all(orchestras)

        # ---------------------------------------------------------
        # Venues
        # ---------------------------------------------------------

        venues = [
            Venue(
                id="musikverein-vienna",
                name="Musikverein",
                address="Musikvereinsplatz 1",
                city="Vienna",
                country="Austria",
                website="https://www.musikverein.at/",
            ),
            Venue(
                id="berliner-philharmonie",
                name="Berliner Philharmonie",
                address="Herbert-von-Karajan-Straße 1",
                city="Berlin",
                country="Germany",
                website="https://www.berliner-philharmonie.de/",
            ),
            Venue(
                id="concertgebouw-amsterdam",
                name="Concertgebouw",
                address="Concertgebouwplein 10",
                city="Amsterdam",
                country="Netherlands",
                website="https://www.concertgebouw.nl/",
            ),
        ]

        db.add_all(venues)

        # ---------------------------------------------------------
        # Conductors
        # ---------------------------------------------------------

        conductors = [
            Conductor(
                id="kirill-petrenko",
                name="Kirill Petrenko",
            ),
            Conductor(
                id="klaus-maekelae",
                name="Klaus Mäkelä",
            ),
        ]

        db.add_all(conductors)

        # ---------------------------------------------------------
        # Concerts
        # ---------------------------------------------------------

        concerts = [
            Concert(
                id="vienna-mahler-2-2026-09-18",
                date=date(2026, 9, 18),
                time=time(19, 30),
                orchestra_id="vienna-philharmonic",
                venue_id="musikverein-vienna",
                conductor_id=None,
            ),
            Concert(
                id="vienna-mahler-2-2026-09-19",
                date=date(2026, 9, 19),
                time=time(19, 30),
                orchestra_id="vienna-philharmonic",
                venue_id="musikverein-vienna",
                conductor_id=None,
            ),
            Concert(
                id="berlin-mahler-1-2-2026-09-27",
                date=date(2026, 9, 27),
                time=time(20, 00),
                orchestra_id="berlin-philharmonic",
                venue_id="berliner-philharmonie",
                conductor_id="kirill-petrenko",
            ),
            Concert(
                id="berlin-mahler-1-2-2026-09-28",
                date=date(2026, 9, 28),
                time=time(20, 00),
                orchestra_id="berlin-philharmonic",
                venue_id="berliner-philharmonie",
                conductor_id="kirill-petrenko",
            ),
            Concert(
                id="amsterdam-bruckner-7-mahler-2-2026-10-03",
                date=date(2026, 10, 3),
                time=time(20, 15),
                orchestra_id="royal-concertgebouw-orchestra",
                venue_id="concertgebouw-amsterdam",
                conductor_id="klaus-maekelae",
            ),
            Concert(
                id="amsterdam-bruckner-7-mahler-2-2026-10-04",
                date=date(2026, 10, 4),
                time=time(14, 15),
                orchestra_id="royal-concertgebouw-orchestra",
                venue_id="concertgebouw-amsterdam",
                conductor_id="klaus-maekelae",
            ),
        ]

        db.add_all(concerts)

        # ---------------------------------------------------------
        # Programme items
        # ---------------------------------------------------------

        programme_items = [
            ProgrammeItem(
                concert_id="vienna-mahler-2-2026-09-18",
                work_id="mahler-symphony-no-2",
                programme_order=1,
            ),
            ProgrammeItem(
                concert_id="vienna-mahler-2-2026-09-19",
                work_id="mahler-symphony-no-2",
                programme_order=1,
            ),
            ProgrammeItem(
                concert_id="berlin-mahler-1-2-2026-09-27",
                work_id="mahler-symphony-no-1",
                programme_order=1,
            ),
            ProgrammeItem(
                concert_id="berlin-mahler-1-2-2026-09-27",
                work_id="mahler-symphony-no-2",
                programme_order=2,
            ),
            ProgrammeItem(
                concert_id="berlin-mahler-1-2-2026-09-28",
                work_id="mahler-symphony-no-1",
                programme_order=1,
            ),
            ProgrammeItem(
                concert_id="berlin-mahler-1-2-2026-09-28",
                work_id="mahler-symphony-no-2",
                programme_order=2,
            ),
            ProgrammeItem(
                concert_id="amsterdam-bruckner-7-mahler-2-2026-10-03",
                work_id="bruckner-symphony-no-7",
                programme_order=1,
            ),
            ProgrammeItem(
                concert_id="amsterdam-bruckner-7-mahler-2-2026-10-03",
                work_id="mahler-symphony-no-2",
                programme_order=2,
            ),
            ProgrammeItem(
                concert_id="amsterdam-bruckner-7-mahler-2-2026-10-04",
                work_id="bruckner-symphony-no-7",
                programme_order=1,
            ),
            ProgrammeItem(
                concert_id="amsterdam-bruckner-7-mahler-2-2026-10-04",
                work_id="mahler-symphony-no-2",
                programme_order=2,
            ),
        ]

        db.add_all(programme_items)

        db.commit()

        print("Database seeded successfully!")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()