from pydantic import BaseModel


class ComposerResponse(BaseModel):
    id: str
    name: str
    birth_year: int | None = None
    death_year: int | None = None
    period: str | None = None
    description: str | None = None
    website: str | None = None

    model_config = {
        "from_attributes": True
    }