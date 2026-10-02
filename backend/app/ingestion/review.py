from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Iterable

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.ingestion.catalog import SQLAlchemyCatalog
from app.ingestion.normalization import normalize_text
from app.ingestion.resolution import (
    ConcertResolution,
    EntityResolution,
    EntityType,
)
from app.models import (
    Composer,
    Conductor,
    IngestionAlias,
    Orchestra,
    Venue,
    Work,
)


@dataclass(frozen=True)
class ReviewItem:
    entity_type: EntityType
    raw_value: str
    context_id: str
    source: str
    city: str | None = None
    country: str | None = None
    candidates: tuple = ()


def slugify(value: str) -> str:
    """
    Create a readable canonical ID.

    Example:
        "Tugan Sokhiev" -> "tugan-sokhiev"
        "Antonín Dvořák" -> "antonin-dvorak"
    """
    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def collect_review_items(
    resolutions: Iterable[ConcertResolution],
) -> list[ReviewItem]:
    """
    Collapse repeated unresolved entities into one review item.

    If Tugan Sokhiev occurs in 20 concerts, the reviewer sees him once.
    """
    collected: dict[tuple[str, str, str], ReviewItem] = {}

    for resolution in resolutions:
        raw = resolution.raw
        source = raw.source

        def add(
            entity: EntityResolution | None,
            *,
            context_id: str = "",
            city: str | None = None,
            country: str | None = None,
        ):
            if entity is None or entity.status == "matched":
                return

            key = (
                entity.entity_type,
                normalize_text(entity.raw_value),
                context_id,
            )

            if key not in collected:
                collected[key] = ReviewItem(
                    entity_type=entity.entity_type,
                    raw_value=entity.raw_value,
                    context_id=context_id,
                    source=source,
                    city=city,
                    country=country,
                    candidates=entity.candidates,
                )

        add(resolution.orchestra)

        add(
            resolution.venue,
            city=raw.city,
            country=raw.country,
        )

        add(resolution.conductor)

        for programme_item in resolution.programme:
            add(programme_item.composer)

            # Work aliases are composer-scoped.
            composer_context = (
                programme_item.composer.canonical_id
                if programme_item.composer.status == "matched"
                else ""
            )

            add(
                programme_item.work,
                context_id=composer_context,
            )

    priority = {
        "orchestra": 0,
        "venue": 1,
        "conductor": 2,
        "composer": 3,
        "work": 4,
    }

    return sorted(
        collected.values(),
        key=lambda item: (
            priority[item.entity_type],
            normalize_text(item.raw_value),
        ),
    )


def _target_label(
    db: Session,
    entity_type: EntityType,
    entity_id: str,
) -> str:
    model = {
        "orchestra": Orchestra,
        "venue": Venue,
        "conductor": Conductor,
        "composer": Composer,
        "work": Work,
    }[entity_type]

    row = db.get(model, entity_id)

    if row is None:
        return entity_id

    if entity_type == "venue":
        return f"{row.name}, {row.city}, {row.country}"

    if entity_type == "work":
        return f"{row.title} ({row.composer_id})"

    return row.name


def _save_alias(
    db: Session,
    item: ReviewItem,
    entity_id: str,
) -> None:
    catalog = SQLAlchemyCatalog(db)

    if not catalog.target_exists(item.entity_type, entity_id):
        raise ValueError(
            f"Canonical {item.entity_type} does not exist: {entity_id}"
        )

    context_id = item.context_id

    if item.entity_type == "work":
        work = db.get(Work, entity_id)
        if work is None:
            raise ValueError(f"Work does not exist: {entity_id}")

        # Always scope work aliases to their canonical composer.
        context_id = work.composer_id

    existing = catalog.alias_target(
        item.entity_type,
        normalize_text(item.raw_value),
        context_id,
    )

    if existing:
        if existing == entity_id:
            print("Alias already exists.")
            return

        raise ValueError(
            f"Alias already points to {existing!r}; "
            f"refusing to silently change it."
        )

    alias = IngestionAlias(
        entity_type=item.entity_type,
        entity_id=entity_id,
        alias=item.raw_value,
        normalized_alias=normalize_text(item.raw_value),
        context_id=context_id,
        source=item.source,
    )

    db.add(alias)
    db.flush()


def _unique_id(db: Session, model, proposed: str) -> str:
    """
    Avoid accidentally overwriting an existing canonical entity.
    """
    if db.get(model, proposed) is None:
        return proposed

    index = 2

    while db.get(model, f"{proposed}-{index}") is not None:
        index += 1

    return f"{proposed}-{index}"


def _prompt(
    label: str,
    default: str | None = None,
    *,
    required: bool = False,
) -> str:
    while True:
        suffix = f" [{default}]" if default else ""
        value = input(f"{label}{suffix}: ").strip()

        if not value and default is not None:
            return default

        if value or not required:
            return value

        print("A value is required.")


def _create_composer(db: Session, item: ReviewItem) -> str:
    print("\nCreate canonical composer")

    name = _prompt("Name", item.raw_value, required=True)
    proposed_id = slugify(name)
    entity_id = _prompt("ID", proposed_id, required=True)

    if db.get(Composer, entity_id):
        raise ValueError(f"Composer ID already exists: {entity_id}")

    birth = _prompt("Birth year (optional)")
    death = _prompt("Death year (optional)")
    period = _prompt("Period (optional)")

    composer = Composer(
        id=entity_id,
        name=name,
        birth_year=int(birth) if birth else None,
        death_year=int(death) if death else None,
        period=period or None,
        description=None,
        website=None,
    )

    db.add(composer)
    db.flush()

    return entity_id


def _create_conductor(db: Session, item: ReviewItem) -> str:
    print("\nCreate canonical conductor")

    name = _prompt("Name", item.raw_value, required=True)
    proposed_id = slugify(name)
    entity_id = _prompt("ID", proposed_id, required=True)

    if db.get(Conductor, entity_id):
        raise ValueError(f"Conductor ID already exists: {entity_id}")

    conductor = Conductor(
        id=entity_id,
        name=name,
        website=None,
    )

    db.add(conductor)
    db.flush()

    return entity_id


def _create_orchestra(db: Session, item: ReviewItem) -> str:
    print("\nCreate canonical orchestra")

    name = _prompt("Name", item.raw_value, required=True)
    proposed_id = slugify(name)
    entity_id = _prompt("ID", proposed_id, required=True)

    if db.get(Orchestra, entity_id):
        raise ValueError(f"Orchestra ID already exists: {entity_id}")

    city = _prompt("City", required=True)
    country = _prompt("Country", required=True)

    orchestra = Orchestra(
        id=entity_id,
        name=name,
        city=city,
        country=country,
        website=None,
    )

    db.add(orchestra)
    db.flush()

    return entity_id


def _create_venue(db: Session, item: ReviewItem) -> str:
    print("\nCreate canonical venue")

    name = _prompt("Name", item.raw_value, required=True)
    proposed_id = slugify(name)
    entity_id = _prompt("ID", proposed_id, required=True)

    if db.get(Venue, entity_id):
        raise ValueError(f"Venue ID already exists: {entity_id}")

    city = _prompt("City", item.city, required=True)
    country = _prompt("Country", item.country, required=True)
    address = _prompt("Address (optional)")

    venue = Venue(
        id=entity_id,
        name=name,
        address=address or None,
        city=city,
        country=country,
        latitude=None,
        longitude=None,
        website=None,
    )

    db.add(venue)
    db.flush()

    return entity_id


def _create_work(db: Session, item: ReviewItem) -> str:
    print("\nCreate canonical work")

    composer_id = item.context_id

    if not composer_id:
        composer_id = _prompt(
            "Canonical composer ID",
            required=True,
        )

    composer = db.get(Composer, composer_id)

    if composer is None:
        raise ValueError(
            f"Composer does not exist: {composer_id}. "
            "Create/resolve the composer first."
        )

    title = _prompt(
        "Canonical English title",
        item.raw_value,
        required=True,
    )

    proposed_id = slugify(f"{composer.name}-{title}")
    entity_id = _prompt("ID", proposed_id, required=True)

    if db.get(Work, entity_id):
        raise ValueError(f"Work ID already exists: {entity_id}")

    year = _prompt("Year (optional)")
    period = _prompt("Period (optional)")

    work = Work(
        id=entity_id,
        composer_id=composer_id,
        title=title,
        subtitle=None,
        year=year or None,
        period=period or None,
        duration=None,
        premiered=None,
        description=None,
        about=[],
        instrumentation_summary=None,
    )

    db.add(work)
    db.flush()

    return entity_id


def _create_entity(
    db: Session,
    item: ReviewItem,
) -> str:
    creators = {
        "composer": _create_composer,
        "conductor": _create_conductor,
        "orchestra": _create_orchestra,
        "venue": _create_venue,
        "work": _create_work,
    }

    return creators[item.entity_type](db, item)


def _print_item(
    item: ReviewItem,
    number: int,
    total: int,
) -> None:
    print("\n" + "=" * 72)
    print(f"[{number}/{total}] {item.entity_type.upper()}")
    print("=" * 72)
    print(f"Raw value: {item.raw_value}")

    if item.entity_type == "venue":
        print(f"Location:  {item.city or '?'} / {item.country or '?'}")

    if item.entity_type == "work":
        print(
            f"Composer context: "
            f"{item.context_id or 'unresolved composer'}"
        )

    if item.candidates:
        print("\nSuggested canonical matches:")

        for index, candidate in enumerate(item.candidates, start=1):
            print(
                f"  [{index}] {candidate.label}"
                f"\n      ID: {candidate.id}"
                f"\n      similarity: {candidate.score:.3f}"
            )
    else:
        print("\nNo canonical candidates found.")

    print(
        "\nActions:"
        "\n  [number] approve suggested candidate"
        "\n  [m]      manually enter canonical ID"
        "\n  [c]      create new canonical entity"
        "\n  [s]      skip for now"
        "\n  [q]      save completed decisions and quit"
    )


def review_items(
    db: Session,
    items: list[ReviewItem],
) -> int:
    """
    Run interactive human review.

    Every accepted decision is committed immediately. Therefore Ctrl+C or
    quitting halfway through does not lose earlier review decisions.
    """
    if not items:
        print("No unresolved entities to review.")
        return 0

    print(
        f"\nConcertFinder human review\n"
        f"{len(items)} unique unresolved/ambiguous entities require review."
    )

    completed = 0

    for number, item in enumerate(items, start=1):
        while True:
            _print_item(item, number, len(items))
            choice = input("\nChoice: ").strip().lower()

            if choice == "s":
                print("Skipped.")
                break

            if choice == "q":
                print(
                    f"\nReview stopped. "
                    f"{completed} decision(s) were saved."
                )
                return completed

            try:
                if choice == "m":
                    entity_id = _prompt(
                        f"Canonical {item.entity_type} ID",
                        required=True,
                    )

                    label = _target_label(
                        db,
                        item.entity_type,
                        entity_id,
                    )

                    confirm = input(
                        f"Map {item.raw_value!r} -> "
                        f"{label!r} ({entity_id})? [y/N]: "
                    ).strip().lower()

                    if confirm != "y":
                        print("Cancelled.")
                        continue

                    _save_alias(db, item, entity_id)
                    db.commit()

                    print(
                        f"Saved alias: {item.raw_value!r} "
                        f"-> {entity_id}"
                    )

                    completed += 1
                    break

                if choice == "c":
                    entity_id = _create_entity(db, item)

                    # Store the source spelling too. This is especially
                    # important if the canonical name/title was edited.
                    _save_alias(db, item, entity_id)

                    db.commit()

                    print(
                        f"Created canonical {item.entity_type}: "
                        f"{entity_id}"
                    )

                    completed += 1
                    break

                if choice.isdigit():
                    candidate_number = int(choice)

                    if not (
                        1 <= candidate_number <= len(item.candidates)
                    ):
                        print("Invalid candidate number.")
                        continue

                    candidate = item.candidates[candidate_number - 1]

                    confirm = input(
                        f"Approve {item.raw_value!r} -> "
                        f"{candidate.label!r} "
                        f"({candidate.id})? [y/N]: "
                    ).strip().lower()

                    if confirm != "y":
                        print("Cancelled.")
                        continue

                    _save_alias(
                        db,
                        item,
                        candidate.id,
                    )

                    db.commit()

                    print(
                        f"Saved alias: {item.raw_value!r} "
                        f"-> {candidate.id}"
                    )

                    completed += 1
                    break

                print("Unknown choice.")

            except (ValueError, IntegrityError) as exc:
                db.rollback()
                print(f"\nCould not save decision: {exc}")

            except KeyboardInterrupt:
                db.rollback()
                print(
                    f"\n\nReview interrupted. "
                    f"{completed} previous decision(s) were already saved."
                )
                return completed

    print(
        f"\nReview complete. "
        f"{completed} decision(s) saved."
    )

    return completed