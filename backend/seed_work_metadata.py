"""Backend-owned snapshot of existing frontend editorial data; no runtime TS dependency."""
import json
from pathlib import Path
import re

from sqlalchemy.orm import Session
from app.models import Instrument, InstrumentFamily, Work, WorkInstrument, WorkRelation


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def seed_work_metadata(db: Session) -> None:
    records = json.loads((Path(__file__).parent / "seed_data/work_metadata.json").read_text())
    # Only backfill works already present; never invent missing works or metadata.
    for record in records:
        work = db.get(Work, record["id"])
        if work is None:
            continue
        work.description = record["description"]
        work.about = record["about"]
        work.instrumentation_summary = record["instrumentation_summary"]
        for group_order, group in enumerate(record["instrumentation"]):
            family_id = slug(group["name"])
            family = db.get(InstrumentFamily, family_id)
            if family is None:
                family = InstrumentFamily(id=family_id, name=group["name"])
                db.add(family)
                db.flush()
            for instrument_order, label in enumerate(group["instruments"]):
                match = re.fullmatch(r"(\d+) × (.+)", label)
                quantity, name = (int(match[1]), match[2]) if match else (None, label)
                instrument_id = f"{family_id}-{slug(name)}"
                instrument = db.get(Instrument, instrument_id)
                if instrument is None:
                    instrument = Instrument(id=instrument_id, name=name, family=family)
                    db.add(instrument)
                    db.flush()
                entry = db.get(WorkInstrument, (work.id, instrument_id))
                if entry is None:
                    entry = WorkInstrument(work_id=work.id, instrument=instrument)
                    db.add(entry)
                entry.quantity = quantity
                entry.display_label = label
                entry.group_order = group_order
                entry.instrument_order = instrument_order
        for position, related_id in enumerate(record["related_work_ids"]):
            if db.get(Work, related_id) is None:
                raise ValueError(f"Missing related work {related_id} for {work.id}")
            link = db.get(WorkRelation, (work.id, related_id))
            if link is None:
                db.add(WorkRelation(work_id=work.id, related_work_id=related_id, position=position))
        db.flush()
