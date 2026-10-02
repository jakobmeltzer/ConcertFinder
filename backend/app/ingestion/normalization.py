from __future__ import annotations

import re
import unicodedata


_PUNCTUATION = re.compile(r"[^a-z0-9]+")


def normalize_text(value: str | None) -> str:
    """Conservative comparison key; never changes stored/display text."""
    if not value:
        return ""
    decomposed = unicodedata.normalize("NFKD", value)
    asciiish = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return _PUNCTUATION.sub(" ", asciiish.casefold()).strip()


def normalize_location(name: str | None, city: str | None, country: str | None) -> tuple[str, str, str]:
    return normalize_text(name), normalize_text(city), normalize_text(country)
