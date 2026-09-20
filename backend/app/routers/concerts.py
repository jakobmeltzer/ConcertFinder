from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Concert, ProgrammeItem, Work
from app.schemas import ConcertResponse


router = APIRouter(
    prefix="/concerts",
    tags=["concerts"],
)


@router.get(
    "/",
    response_model=list[ConcertResponse],
)
def get_concerts(db: Session = Depends(get_db)):
    concerts = (
        db.query(Concert)
        .options(
            # Load orchestra
            joinedload(Concert.orchestra),

            # Load venue
            joinedload(Concert.venue),

            # Load conductor
            joinedload(Concert.conductor),

            # Load each programme item's work
            # and the work's composer
            joinedload(Concert.programme_items)
            .joinedload(ProgrammeItem.work)
            .joinedload(Work.composer),
        )
        .order_by(Concert.date, Concert.time)
        .all()
    )

    return [
        {
            "id": concert.id,
            "date": concert.date.isoformat(),
            "time": concert.time.isoformat(),

            "orchestra": concert.orchestra,
            "venue": concert.venue,
            "conductor": concert.conductor,

            "programme": [
                {
                    "order": item.programme_order,
                    "work": item.work,
                }
                for item in concert.programme_items
            ],

            "ticket_url": concert.ticket_url,
            "source_url": concert.source_url,
        }
        for concert in concerts
    ]


@router.get(
    "/{concert_id}",
    response_model=ConcertResponse,
)
def get_concert(
    concert_id: str,
    db: Session = Depends(get_db),
):
    concert = (
        db.query(Concert)
        .options(
            # Load orchestra
            joinedload(Concert.orchestra),

            # Load venue
            joinedload(Concert.venue),

            # Load conductor
            joinedload(Concert.conductor),

            # Load each programme item's work
            # and the work's composer
            joinedload(Concert.programme_items)
            .joinedload(ProgrammeItem.work)
            .joinedload(Work.composer),
        )
        .filter(Concert.id == concert_id)
        .first()
    )

    if concert is None:
        raise HTTPException(
            status_code=404,
            detail="Concert not found",
        )

    return {
        "id": concert.id,
        "date": concert.date.isoformat(),
        "time": concert.time.isoformat(),

        "orchestra": concert.orchestra,
        "venue": concert.venue,
        "conductor": concert.conductor,

        "programme": [
            {
                "order": item.programme_order,
                "work": item.work,
            }
            for item in concert.programme_items
        ],

        "ticket_url": concert.ticket_url,
        "source_url": concert.source_url,
    }