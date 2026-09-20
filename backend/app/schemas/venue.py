from pydantic import BaseModel


class VenueResponse(BaseModel):
    id: str
    name: str
    address: str | None = None
    city: str
    country: str
    latitude: float | None = None
    longitude: float | None = None
    website: str | None = None

    model_config = {
        "from_attributes": True
    }