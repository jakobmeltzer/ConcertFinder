from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Composer
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
        .options(
            joinedload(Composer.works)
        )
        .all()
    )

    return composers


@router.get(
    "/{composer_id}",
    response_model=ComposerResponse,
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

    return composer