from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Composer, Work, Concert, ProgrammeItem
from app.schemas.composer_detail import ComposerDetailResponse
from app.schemas import ComposerResponse


router = APIRouter(
    prefix="/composers",
    tags=["composers"],
)


@router.get(
    "/",
    response_model=list[ComposerResponse],
)
def get_composers(db: Session = Depends(get_db)):
    composers = (
        db.query(Composer)
        .all()
    )

    return composers


@router.get(
    "/{composer_id}",
    response_model=ComposerDetailResponse,
)
def get_composer(
    composer_id: str,
    db: Session = Depends(get_db),
):
    composer = (
        db.query(Composer)
        .filter(Composer.id == composer_id)
        .first()
    )

    if composer is None:
        raise HTTPException(
            status_code=404,
            detail="Composer not found",
        )

    works = (
        db.query(Work).options(joinedload(Work.composer))
        .filter(Work.composer_id == composer_id)
        .order_by(Work.title, Work.id).all()
    )
    # EXISTS avoids duplicate concerts when several works share the composer.
    concerts = (
        db.query(Concert).options(
            joinedload(Concert.orchestra), joinedload(Concert.venue), joinedload(Concert.conductor),
        )
        .filter(Concert.programme_items.any(ProgrammeItem.work.has(Work.composer_id == composer_id)))
        .order_by(Concert.date, Concert.time, Concert.id).all()
    )
    return {
        **ComposerResponse.model_validate(composer).model_dump(),
        "works": works,
        "performances": [{
            "id": concert.id, "date": concert.date.isoformat(), "time": concert.time.isoformat(),
            "orchestra": concert.orchestra, "venue": concert.venue, "conductor": concert.conductor,
        } for concert in concerts],
    }
