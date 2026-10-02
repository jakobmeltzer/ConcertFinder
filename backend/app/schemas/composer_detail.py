from app.schemas.composer import ComposerResponse
from app.schemas.work import WorkResponse, WorkPerformanceResponse


class ComposerDetailResponse(ComposerResponse):
    works: list[WorkResponse]
    performances: list[WorkPerformanceResponse]
