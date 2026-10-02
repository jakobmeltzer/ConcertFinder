from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ingestion.resolution import ConcertResolution
from app.models import Concert, ProgrammeItem

ImportAction = Literal["insert", "update", "skip", "blocked"]


@dataclass(frozen=True)
class ImportPlan:
    action: ImportAction
    concert_id: str | None
    reason: str


def _slug(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")
    return value or "concert"


def canonical_concert_id(resolution: ConcertResolution) -> str:
    raw = resolution.raw
    return f"{_slug(raw.source)}-{raw.source_event_id}"


def plan_import(db: Session, resolution: ConcertResolution) -> ImportPlan:
    if not resolution.ready_to_import:
        labels = ", ".join(f"{b.entity_type}:{b.raw_value}" for b in resolution.blockers)
        extra = []
        if not resolution.raw.source_event_id:
            extra.append("missing source_event_id")
        if resolution.raw.time is None:
            extra.append("missing start time")
        reason = "; ".join(filter(None, [f"unresolved entities: {labels}" if labels else "", ", ".join(extra)]))
        return ImportPlan("blocked", None, reason or "record is not import-ready")

    raw = resolution.raw
    existing = db.execute(select(Concert).where(Concert.source == raw.source, Concert.source_event_id == raw.source_event_id)).scalar_one_or_none()
    if existing is None:
        return ImportPlan("insert", canonical_concert_id(resolution), "new source event")

    work_ids = [item.work.canonical_id for item in resolution.programme]
    existing_work_ids = [p.work_id for p in sorted(existing.programme_items, key=lambda p: p.programme_order)]
    conductor_id = resolution.conductor.canonical_id if resolution.conductor else None
    changed = any([
        existing.title != raw.title,
        existing.date != raw.date,
        existing.time != raw.time,
        existing.timezone != raw.timezone,
        existing.orchestra_id != resolution.orchestra.canonical_id,
        existing.venue_id != resolution.venue.canonical_id,
        existing.conductor_id != conductor_id,
        existing.ticket_url != (str(raw.ticket_url) if raw.ticket_url else None),
        existing.source_url != str(raw.source_url),
        existing_work_ids != work_ids,
    ])
    return ImportPlan("update" if changed else "skip", existing.id, "source event changed" if changed else "no canonical changes")


def apply_import(db: Session, resolution: ConcertResolution, plan: ImportPlan | None = None) -> ImportPlan:
    # A caller-supplied plan must never bypass unresolved metadata.
    if not resolution.ready_to_import:
        raise ValueError("record is not import-ready")
    plan = plan or plan_import(db, resolution)
    if plan.action == "blocked":
        raise ValueError(plan.reason)
    if plan.action == "skip":
        return plan

    raw = resolution.raw
    conductor_id = resolution.conductor.canonical_id if resolution.conductor else None
    if plan.action == "insert":
        concert = Concert(id=plan.concert_id)
        db.add(concert)
    else:
        concert = db.get(Concert, plan.concert_id)
        if concert is None:
            raise RuntimeError(f"planned concert disappeared: {plan.concert_id}")
        concert.programme_items.clear()
        db.flush()

    concert.title = raw.title
    concert.date = raw.date
    concert.time = raw.time
    concert.timezone = raw.timezone
    concert.source = raw.source
    concert.source_event_id = raw.source_event_id
    concert.orchestra_id = resolution.orchestra.canonical_id
    concert.venue_id = resolution.venue.canonical_id
    concert.conductor_id = conductor_id
    concert.ticket_url = str(raw.ticket_url) if raw.ticket_url else None
    concert.source_url = str(raw.source_url)
    concert.programme_items = [
        ProgrammeItem(programme_order=item.order, work_id=item.work.canonical_id)
        for item in resolution.programme
    ]
    db.flush()
    return plan
