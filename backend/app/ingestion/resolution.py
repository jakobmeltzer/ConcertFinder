from __future__ import annotations

from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Literal, Protocol

from app.ingestion.normalization import normalize_location, normalize_text
from app.ingestion.schemas import RawConcert
from app.ingestion.validation import validate_raw_concert

EntityType = Literal["orchestra", "venue", "conductor", "composer", "work"]
ResolutionStatus = Literal["matched", "unresolved", "ambiguous"]


@dataclass(frozen=True)
class Candidate:
    id: str
    label: str
    score: float


@dataclass(frozen=True)
class EntityResolution:
    entity_type: EntityType
    raw_value: str
    status: ResolutionStatus
    canonical_id: str | None = None
    method: str | None = None
    candidates: tuple[Candidate, ...] = ()


@dataclass(frozen=True)
class ResolvedProgrammeItem:
    order: int
    composer: EntityResolution
    work: EntityResolution


@dataclass(frozen=True)
class ConcertResolution:
    raw: RawConcert
    orchestra: EntityResolution
    venue: EntityResolution
    conductor: EntityResolution | None
    programme: tuple[ResolvedProgrammeItem, ...]

    @property
    def ready_to_import(self) -> bool:
        required = [self.orchestra, self.venue]
        if self.conductor is not None:
            required.append(self.conductor)
        required.extend(item.composer for item in self.programme)
        required.extend(item.work for item in self.programme)
        return bool(self.raw.source_event_id and self.raw.time) and all(r.status == "matched" for r in required)

    @property
    def blockers(self) -> tuple[EntityResolution, ...]:
        all_resolutions = [self.orchestra, self.venue]
        if self.conductor is not None:
            all_resolutions.append(self.conductor)
        all_resolutions.extend(item.composer for item in self.programme)
        all_resolutions.extend(item.work for item in self.programme)
        return tuple(r for r in all_resolutions if r.status != "matched")


class Catalog(Protocol):
    def rows(self, entity_type: EntityType) -> list[tuple[str, str]]: ...
    def venues(self) -> list[tuple[str, str, str, str]]: ...
    def works_for_composer(self, composer_id: str) -> list[tuple[str, str]]: ...
    def alias_target(self, entity_type: EntityType, normalized_alias: str, context_id: str = "") -> str | None: ...
    def target_exists(self, entity_type: EntityType, entity_id: str) -> bool: ...



def _suggest(raw: str, rows: list[tuple[str, str]], *, limit: int = 3) -> tuple[Candidate, ...]:
    key = normalize_text(raw)
    scored = [Candidate(id=row_id, label=label, score=round(SequenceMatcher(None, key, normalize_text(label)).ratio(), 3)) for row_id, label in rows]
    return tuple(sorted((c for c in scored if c.score >= 0.55), key=lambda c: c.score, reverse=True)[:limit])


def _resolve_named(catalog: Catalog, entity_type: EntityType, raw: str) -> EntityResolution:
    key = normalize_text(raw)
    alias = catalog.alias_target(entity_type, key, "")
    if alias and catalog.target_exists(entity_type, alias):
        return EntityResolution(entity_type, raw, "matched", alias, "alias")

    rows = catalog.rows(entity_type)
    exact = [(entity_id, label) for entity_id, label in rows if normalize_text(label) == key]
    if len(exact) == 1:
        return EntityResolution(entity_type, raw, "matched", exact[0][0], "normalized-exact")
    if len(exact) > 1:
        return EntityResolution(entity_type, raw, "ambiguous", candidates=tuple(Candidate(i, l, 1.0) for i, l in exact))
    return EntityResolution(entity_type, raw, "unresolved", candidates=_suggest(raw, rows))


def _resolve_venue(catalog: Catalog, raw: RawConcert) -> EntityResolution:
    value = raw.venue or ""
    key = normalize_text(value)
    alias = catalog.alias_target("venue", key, "")
    if alias and catalog.target_exists("venue", alias):
        return EntityResolution("venue", value, "matched", alias, "alias")

    wanted = normalize_location(raw.venue, raw.city, raw.country)
    rows = catalog.venues()
    exact = [(i, n) for i, n, c, country in rows if normalize_location(n, c, country) == wanted]
    if len(exact) == 1:
        return EntityResolution("venue", value, "matched", exact[0][0], "normalized-exact")
    candidates = _suggest(value, [(i, f"{n}, {c}, {country}") for i, n, c, country in rows])
    return EntityResolution("venue", value, "ambiguous" if len(exact) > 1 else "unresolved", candidates=candidates)


def _resolve_work(catalog: Catalog, raw_work: str, composer: EntityResolution) -> EntityResolution:
    key = normalize_text(raw_work)
    alias = catalog.alias_target("work", key, composer.canonical_id or "")
    if alias and catalog.target_exists("work", alias):
        return EntityResolution("work", raw_work, "matched", alias, "alias")
    if composer.status != "matched" or not composer.canonical_id:
        return EntityResolution("work", raw_work, "unresolved")
    rows = catalog.works_for_composer(composer.canonical_id)
    exact = [(i, title) for i, title in rows if normalize_text(title) == key]
    if len(exact) == 1:
        return EntityResolution("work", raw_work, "matched", exact[0][0], "normalized-exact")
    if len(exact) > 1:
        return EntityResolution("work", raw_work, "ambiguous", candidates=tuple(Candidate(i, t, 1.0) for i, t in exact))
    return EntityResolution("work", raw_work, "unresolved", candidates=_suggest(raw_work, rows))


def resolve_concert(raw: RawConcert, catalog: Catalog) -> ConcertResolution:
    validate_raw_concert(raw)
    orchestra = _resolve_named(catalog, "orchestra", raw.orchestra or "")
    venue = _resolve_venue(catalog, raw)
    conductor = _resolve_named(catalog, "conductor", raw.conductor) if raw.conductor else None
    programme = []
    for item in raw.programme:
        composer = _resolve_named(catalog, "composer", item.raw_composer or "")
        work = _resolve_work(catalog, item.raw_work, composer)
        programme.append(ResolvedProgrammeItem(item.order, composer, work))
    return ConcertResolution(raw, orchestra, venue, conductor, tuple(programme))
