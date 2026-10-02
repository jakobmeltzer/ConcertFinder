from urllib.parse import urlparse
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.ingestion.schemas import RawConcert


class IngestionValidationError(ValueError):
    pass


def validate_raw_concert(concert: RawConcert) -> RawConcert:
    parsed = urlparse(str(concert.source_url))
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise IngestionValidationError("source_url must be an absolute HTTP(S) URL")

    if concert.time is not None and not concert.timezone:
        raise IngestionValidationError("timezone is required when a start time is present")

    if concert.timezone:
        try:
            ZoneInfo(concert.timezone)
        except ZoneInfoNotFoundError as exc:
            raise IngestionValidationError(f"unknown IANA timezone: {concert.timezone}") from exc

    if not concert.venue:
        raise IngestionValidationError("venue is required for crawler import")
    if not concert.city:
        raise IngestionValidationError("city is required for crawler import")
    if not concert.country:
        raise IngestionValidationError("country is required for crawler import")
    if not concert.programme:
        raise IngestionValidationError("programme is required for crawler import")

    return concert
