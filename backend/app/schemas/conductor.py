from pydantic import BaseModel


class ConductorResponse(BaseModel):
    id: str
    name: str
    website: str | None = None

    model_config = {
        "from_attributes": True
    }