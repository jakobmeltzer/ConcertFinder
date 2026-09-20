from pydantic import BaseModel

from app.schemas.composer import ComposerResponse
from app.schemas.conductor import ConductorResponse
from app.schemas.orchestra import OrchestraResponse
from app.schemas.venue import VenueResponse


class ProgrammeWorkResponse(BaseModel):
    id: str
    title: str
    subtitle: str | None = None
    composer: ComposerResponse

    model_config = {
        "from_attributes": True
    }


class ProgrammeItemResponse(BaseModel):
    order: int
    work: ProgrammeWorkResponse


class ConcertResponse(BaseModel):
    id: str
    date: str
    time: str

    orchestra: OrchestraResponse
    venue: VenueResponse
    conductor: ConductorResponse | None = None

    programme: list[ProgrammeItemResponse]

    ticket_url: str | None = None
    source_url: str | None = None