from pydantic import BaseModel

from app.schemas.composer import ComposerResponse
from app.schemas.orchestra import OrchestraResponse
from app.schemas.venue import VenueResponse
from app.schemas.conductor import ConductorResponse


class WorkBaseResponse(BaseModel):
    id: str
    title: str
    subtitle: str | None = None
    year: str | None = None
    period: str | None = None
    duration: str | None = None
    premiered: str | None = None
    description: str | None = None

    model_config = {
        "from_attributes": True
    }


class WorkResponse(WorkBaseResponse):
    composer: ComposerResponse


class WorkPerformanceResponse(BaseModel):
    id: str
    date: str
    time: str

    orchestra: OrchestraResponse
    venue: VenueResponse
    conductor: ConductorResponse | None = None


class WorkInstrumentResponse(BaseModel):
    id: str
    name: str
    quantity: int | None
    display_label: str


class InstrumentGroupResponse(BaseModel):
    id: str
    name: str
    instruments: list[WorkInstrumentResponse]


class WorkDetailResponse(WorkBaseResponse):
    composer: ComposerResponse
    performances: list[WorkPerformanceResponse]
    about: list[str]
    instrumentation_summary: str | None
    instrumentation: list[InstrumentGroupResponse]
    related_works: list[WorkResponse]
