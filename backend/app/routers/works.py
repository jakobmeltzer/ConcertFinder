from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_db
from app.models import Work, Concert, ProgrammeItem, WorkInstrument, Instrument, WorkRelation
from app.schemas import WorkDetailResponse, WorkResponse


router = APIRouter(
    prefix="/works",
    tags=["works"],
)


@router.get(
    "/",
    response_model=list[WorkResponse],
)
def get_works(db: Session = Depends(get_db)):
    works = (
        db.query(Work)
        .options(
            joinedload(Work.composer)
        )
        .all()
    )

    return works


@router.get(
    "/{work_id}",
    response_model=WorkDetailResponse,
)
def get_work(
    work_id: str,
    db: Session = Depends(get_db),
):
    work = (
        db.query(Work)
        .options(
            selectinload(Work.instruments).joinedload(WorkInstrument.instrument).joinedload(Instrument.family),
            selectinload(Work.related_links).joinedload(WorkRelation.related_work).joinedload(Work.composer),
            # Load the composer
            joinedload(Work.composer),

            # Load the concert for each programme item,
            # together with its orchestra
            joinedload(Work.programme_items)
            .joinedload(ProgrammeItem.concert)
            .joinedload(Concert.orchestra),

            # Load the venue
            joinedload(Work.programme_items)
            .joinedload(ProgrammeItem.concert)
            .joinedload(Concert.venue),

            # Load the conductor
            joinedload(Work.programme_items)
            .joinedload(ProgrammeItem.concert)
            .joinedload(Concert.conductor),
        )
        .filter(Work.id == work_id)
        .first()
    )

    if work is None:
        raise HTTPException(
            status_code=404,
            detail="Work not found",
        )

    performances = []

    # A work may occur more than once in a programme; return each concert once.
    concerts = {item.concert.id: item.concert for item in work.programme_items}
    for concert in sorted(concerts.values(), key=lambda c: (c.date, c.time, c.id)):

        performances.append(
            {
                "id": concert.id,
                "date": concert.date.isoformat(),
                "time": concert.time.isoformat(),
                "orchestra": concert.orchestra,
                "venue": concert.venue,
                "conductor": concert.conductor,
            }
        )

    groups = {}
    for entry in work.instruments:
        instrument = entry.instrument
        family = instrument.family
        group = groups.setdefault(family.id, {"id": family.id, "name": family.name, "instruments": []})
        group["instruments"].append({
            "id": instrument.id, "name": instrument.name,
            "quantity": entry.quantity, "display_label": entry.display_label,
        })

    return {
        "about": work.about,
        "instrumentation_summary": work.instrumentation_summary,
        "instrumentation": list(groups.values()),
        "related_works": [link.related_work for link in work.related_links],
        "id": work.id,
        "title": work.title,
        "subtitle": work.subtitle,
        "year": work.year,
        "period": work.period,
        "duration": work.duration,
        "premiered": work.premiered,
        "description": work.description,
        "composer": work.composer,
        "performances": performances,
    }