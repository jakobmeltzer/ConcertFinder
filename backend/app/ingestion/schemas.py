from datetime import date as Date, datetime as DateTime, time as Time
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator


class RawProgrammeItem(BaseModel):
    order: int = Field(ge=1)
    raw_composer: str | None = None
    raw_work: str

    @field_validator("raw_composer", "raw_work", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class RawConcert(BaseModel):
    source: str
    source_event_id: str | None = None
    source_url: HttpUrl
    crawled_at: DateTime
    title: str | None = None
    date: Date
    time: Time | None = None
    timezone: str | None = None
    venue: str | None = None
    city: str | None = None
    country: str | None = None
    orchestra: str | None = None
    conductor: str | None = None
    programme: list[RawProgrammeItem] = Field(default_factory=list)
    ticket_url: HttpUrl | None = None
    # Evidence captured from the same HTTP response as the parsed fields.
    source_text: str | None = None

    @field_validator(
        "source", "source_event_id", "title", "timezone", "venue", "city",
        "country", "orchestra", "conductor", mode="before"
    )
    @classmethod
    def strip_optional_text(cls, value):
        if not isinstance(value, str):
            return value
        value = value.strip()
        return value or None

    @model_validator(mode="after")
    def validate_programme_order(self):
        orders = [item.order for item in self.programme]
        if len(orders) != len(set(orders)):
            raise ValueError("programme positions must be unique")
        if orders and sorted(orders) != list(range(1, len(orders) + 1)):
            raise ValueError("programme positions must be contiguous starting at 1")
        return self


class DryRunRecord(BaseModel):
    status: Literal["raw-valid", "rejected"]
    concert: RawConcert | None = None
    error: str | None = None
    source_url: str | None = None
