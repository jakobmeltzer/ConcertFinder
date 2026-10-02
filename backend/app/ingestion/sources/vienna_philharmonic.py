"""Dry-run crawler for the public Vienna Philharmonic concert calendar.

This source adapter deliberately does not write to PostgreSQL. It fetches the
public calendar, discovers concert detail URLs, parses them into RawConcert
records, validates them, and prints JSON for inspection.
"""
from __future__ import annotations

import argparse
import json
import logging
import re
import time as time_module
from datetime import datetime, time
from html import unescape
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
from pydantic import ValidationError

from app.ingestion.schemas import DryRunRecord, RawConcert, RawProgrammeItem
from app.ingestion.validation import IngestionValidationError, validate_raw_concert

SOURCE = "vienna-philharmonic"
BASE_URL = "https://www.wienerphilharmoniker.at"
CALENDAR_URL = f"{BASE_URL}/en/konzerte"
USER_AGENT = "ConcertFinder/0.1 (+personal classical-concert discovery project)"
REQUEST_TIMEOUT_SECONDS = 15
REQUEST_DELAY_SECONDS = 1.0
CITY_TIMEZONES = {
    ("vienna", "austria"): "Europe/Vienna",
    ("grafenegg", "austria"): "Europe/Vienna",
    ("salzburg", "austria"): "Europe/Vienna",
    ("lucerne", "switzerland"): "Europe/Zurich",
    ("zurich", "switzerland"): "Europe/Zurich",
    ("berlin", "germany"): "Europe/Berlin",
    ("hamburg", "germany"): "Europe/Berlin",
    ("dresden", "germany"): "Europe/Berlin",
    ("munich", "germany"): "Europe/Berlin",
    ("prague", "czech republic"): "Europe/Prague",
}


def _timezone_for_location(city: str | None, country: str | None) -> str | None:
    """Resolve only locations we know deterministically.

    Never fall back to Vienna merely because this is the Vienna Philharmonic
    source: touring concerts must retain the venue's local timezone. Unknown
    locations remain unresolved and validation rejects timed events until a
    timezone rule is added.
    """
    if not city or not country:
        return None
    return CITY_TIMEZONES.get((city.casefold().strip(), country.casefold().strip()))

logger = logging.getLogger(__name__)

_EVENT_PATH = re.compile(r"^/en/konzerte/[^?#]+/(\d+)/?$")
_DATE_FORMATS = ("%A, %B %d, %Y", "%a, %B %d, %Y")
_TIME_RE = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")


def fetch_html(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return response.read().decode(charset, errors="replace")
    except (HTTPError, URLError, TimeoutError) as exc:
        raise RuntimeError(f"failed to fetch {url}: {exc}") from exc


def discover_event_urls(calendar_html: str, limit: int | None = None) -> list[str]:
    soup = BeautifulSoup(calendar_html, "html.parser")
    discovered: list[str] = []
    seen: set[str] = set()

    for anchor in soup.find_all("a", href=True):
        absolute = urljoin(BASE_URL, anchor["href"])
        parsed = urlparse(absolute)
        if parsed.netloc != urlparse(BASE_URL).netloc:
            continue
        if not _EVENT_PATH.match(parsed.path):
            continue
        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        if clean in seen:
            continue
        seen.add(clean)
        discovered.append(clean)
        if limit is not None and len(discovered) >= limit:
            break

    return discovered


def _parse_date(value: str):
    value = re.sub(r"\s+", " ", value).strip()
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            pass
    raise ValueError(f"could not parse concert date: {value!r}")


def _split_location(value: str) -> tuple[str, str, str]:
    # Source location lines end in city, country. Venue itself may contain commas.
    parts = [part.strip() for part in value.split(",") if part.strip()]
    if len(parts) < 3:
        raise ValueError(f"could not split venue/city/country: {value!r}")
    return ", ".join(parts[:-2]), parts[-2], parts[-1]


def _event_id_from_url(url: str) -> str | None:
    match = _EVENT_PATH.match(urlparse(url).path)
    return match.group(1) if match else None


def _json_ld_events(soup: BeautifulSoup) -> list[dict]:
    events: list[dict] = []
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text()
        if not raw.strip():
            continue
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            continue
        candidates = payload if isinstance(payload, list) else [payload]
        for candidate in candidates:
            if isinstance(candidate, dict) and candidate.get("@type") == "Event":
                events.append(candidate)
            elif isinstance(candidate, dict) and isinstance(candidate.get("@graph"), list):
                events.extend(
                    item for item in candidate["@graph"]
                    if isinstance(item, dict) and item.get("@type") == "Event"
                )
    return events


def _programme_from_markup(soup: BeautifulSoup) -> list[RawProgrammeItem]:
    """Extract composer/work pairs from the event's Program entry only."""
    info = soup.select_one(".programm-info.event")
    if info is None:
        return []

    program_entry = None
    for entry in info.select(".entry"):
        label = entry.select_one(".subhead")
        if label and label.get_text(" ", strip=True).casefold() in {"program", "programme"}:
            program_entry = entry
            break
    if program_entry is None:
        return []

    items: list[RawProgrammeItem] = []
    pending_composer: str | None = None
    for span in program_entry.select("span.subline.primary-color"):
        text = span.get_text(" ", strip=True).strip(" ,")
        if not text:
            continue
        if "cast-programm" in (span.get("class") or []):
            if pending_composer:
                items.append(RawProgrammeItem(
                    order=len(items) + 1,
                    raw_composer=pending_composer,
                    raw_work=text,
                ))
                pending_composer = None
        else:
            pending_composer = text
    return items


def _event_credit(soup: BeautifulSoup, label: str) -> str | None:
    """Read a labelled credit from the event body, never from site navigation."""
    info = soup.select_one(".programm-info.event")
    if info is None:
        return None
    wanted = label.casefold()
    for entry in info.select(".entry"):
        heading = entry.select_one(".subhead")
        if not heading or heading.get_text(" ", strip=True).casefold() != wanted:
            continue
        value = entry.select_one(".subline.primary-color")
        return value.get_text(" ", strip=True) if value else None
    return None


def _ticket_url(soup: BeautifulSoup, source_url: str) -> str | None:
    intro = soup.select_one(".event-intro")
    if intro is None:
        return None
    ticket = intro.select_one(".ticket-link")
    if ticket is None:
        return None
    for attr in ("data-external-url", "data-url"):
        value = (ticket.get(attr) or "").strip()
        if value:
            return urljoin(source_url, value)
    return None


def parse_event_page(html: str, source_url: str, *, crawled_at: datetime | None = None) -> RawConcert:
    soup = BeautifulSoup(html, "html.parser")
    crawled_at = crawled_at or datetime.now().astimezone()

    h1 = soup.find("h1")
    if h1 is None:
        raise ValueError("event page has no h1 title")
    title = h1.get_text(" ", strip=True)

    # JSON-LD, when present, is the least brittle source for date/location.
    ld_events = _json_ld_events(soup)
    ld = ld_events[0] if ld_events else {}

    event_date = None
    event_time = None
    timezone = None
    start_date = ld.get("startDate") if isinstance(ld, dict) else None
    if isinstance(start_date, str):
        try:
            parsed_start = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            event_date = parsed_start.date()
            event_time = parsed_start.timetz().replace(tzinfo=None)
        except ValueError:
            pass

    strings = [unescape(s).strip() for s in soup.stripped_strings if s.strip()]
    if event_date is None:
        for value in strings:
            try:
                event_date = _parse_date(value)
                break
            except ValueError:
                continue
    if event_date is None:
        raise ValueError("could not find event date")

    if event_time is None:
        for value in strings:
            if _TIME_RE.match(value):
                hour, minute = map(int, value.split(":"))
                event_time = time(hour, minute)
                break

    venue = city = country = None
    location = ld.get("location") if isinstance(ld, dict) else None
    if isinstance(location, dict):
        address = location.get("address")
        venue = location.get("name") or None
        if isinstance(address, dict):
            city = address.get("addressLocality") or None
            country_value = address.get("addressCountry")
            country = country_value.get("name") if isinstance(country_value, dict) else country_value

    # Fallback: the visible line immediately combines venue, city and country.
    if not (venue and city and country):
        time_index = next((i for i, value in enumerate(strings) if _TIME_RE.match(value)), None)
        if time_index is not None:
            for value in strings[time_index + 1: time_index + 6]:
                try:
                    venue, city, country = _split_location(value)
                    break
                except ValueError:
                    continue
    if not (venue and city and country):
        raise ValueError("could not parse event location")

    conductor = _event_credit(soup, "Conductor")
    orchestra = _event_credit(soup, "Orchestra")
    programme = _programme_from_markup(soup)
    timezone = _timezone_for_location(city, country)
    ticket_url = _ticket_url(soup, source_url)

    return RawConcert(
        source=SOURCE,
        source_event_id=_event_id_from_url(source_url),
        source_url=source_url,
        crawled_at=crawled_at,
        title=title,
        date=event_date,
        time=event_time,
        timezone=timezone,
        venue=venue,
        city=city,
        country=country,
        orchestra=orchestra,
        conductor=conductor,
        programme=programme,
        ticket_url=ticket_url,
        source_text=extract_source_text(html, source_url),
    )


def extract_source_text(html: str, source_url: str) -> str:
    """Keep independent page evidence, including structured dates and ticket links."""
    soup = BeautifulSoup(html, "html.parser")
    structured = [json.dumps(event, ensure_ascii=False) for event in _json_ld_events(soup)]
    ticket = _ticket_url(soup, source_url)
    for element in soup.select("script, style, nav, header, footer, noscript"):
        element.decompose()
    parts = [soup.get_text("\n", strip=True), *structured]
    if ticket:
        parts.append(f"Ticket URL: {ticket}")
    return "\n".join(parts)


def crawl(limit: int = 5, *, validate: bool = True) -> list[RawConcert]:
    if limit < 1:
        raise ValueError("limit must be at least 1")
    calendar_html = fetch_html(CALENDAR_URL)
    urls = discover_event_urls(calendar_html, limit=limit)
    if not urls:
        raise RuntimeError("no event detail URLs discovered; source markup may have changed")

    concerts: list[RawConcert] = []
    for index, url in enumerate(urls):
        if index:
            time_module.sleep(REQUEST_DELAY_SECONDS)
        logger.info("Fetching %s", url)
        concert = parse_event_page(fetch_html(url), url)
        # LLM review may repair incomplete parsed metadata before validation.
        concerts.append(validate_raw_concert(concert) if validate else concert)
    return concerts


def dry_run(limit: int = 5) -> list[DryRunRecord]:
    calendar_html = fetch_html(CALENDAR_URL)
    urls = discover_event_urls(calendar_html, limit=limit)
    results: list[DryRunRecord] = []
    for index, url in enumerate(urls):
        if index:
            time_module.sleep(REQUEST_DELAY_SECONDS)
        try:
            concert = validate_raw_concert(parse_event_page(fetch_html(url), url))
            results.append(DryRunRecord(status="raw-valid", concert=concert, source_url=url))
        except (RuntimeError, ValueError, ValidationError, IngestionValidationError) as exc:
            results.append(DryRunRecord(status="rejected", error=str(exc), source_url=url))
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Vienna Philharmonic RawConcert dry-run crawler")
    parser.add_argument("--limit", type=int, default=5, help="maximum event detail pages to fetch")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO if args.verbose else logging.WARNING)

    results = dry_run(limit=args.limit)
    print(json.dumps([item.model_dump(mode="json") for item in results], indent=2, ensure_ascii=False))
    rejected = sum(item.status == "rejected" for item in results)
    if rejected:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
