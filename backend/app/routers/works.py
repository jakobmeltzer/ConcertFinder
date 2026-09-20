from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Work, Concert, ProgrammeItem
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

    for programme_item in work.programme_items:
        concert = programme_item.concert

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

    return {
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