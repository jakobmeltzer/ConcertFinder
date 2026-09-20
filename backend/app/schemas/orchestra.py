from pydantic import BaseModel


class OrchestraResponse(BaseModel):
    id: str
    name: str
    city: str
    country: str
    website: str | None = None

    model_config = {
        "from_attributes": True
    }