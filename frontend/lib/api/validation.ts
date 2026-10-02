import type {
  ComposerDetailResponse, InstrumentGroupResponse, WorkInstrumentResponse, ComposerResponse, ConcertResponse, ConductorResponse, OrchestraResponse,
  ProgrammeItemResponse, ProgrammeWorkResponse, VenueResponse,
  WorkDetailResponse, WorkPerformanceResponse, WorkResponse,
} from "./types";

type Guard<T> = (value: unknown) => value is T;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const isString = (value: unknown): value is string => typeof value === "string";
const isId = (value: unknown): value is string => isString(value) && value.length > 0;
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isInteger = (value: unknown): value is number => isNumber(value) && Number.isInteger(value);
const nullable = <T>(guard: Guard<T>) => (value: unknown): value is T | null => value === null || guard(value);
const nullableString = nullable(isString);

export function isComposer(value: unknown): value is ComposerResponse {
  return isRecord(value) && isId(value.id) && isString(value.name)
    && nullable(isInteger)(value.birth_year) && nullable(isInteger)(value.death_year)
    && nullableString(value.period) && nullableString(value.description)
    && nullableString(value.website);
}

function isOrchestra(value: unknown): value is OrchestraResponse {
  return isRecord(value) && isId(value.id) && isString(value.name)
    && isString(value.city) && isString(value.country) && nullableString(value.website);
}

function isVenue(value: unknown): value is VenueResponse {
  return isRecord(value) && nullableString(value.address)
    && nullable(isNumber)(value.latitude) && nullable(isNumber)(value.longitude) && isOrchestra(value);
}

function isConductor(value: unknown): value is ConductorResponse {
  return isRecord(value) && isId(value.id) && isString(value.name) && nullableString(value.website);
}

function isProgrammeWork(value: unknown): value is ProgrammeWorkResponse {
  return isRecord(value) && isId(value.id) && isString(value.title)
    && nullableString(value.subtitle) && nullableString(value.year)
    && nullableString(value.duration) && isComposer(value.composer);
}

export function isWork(value: unknown): value is WorkResponse {
  return isRecord(value) && nullableString(value.year) && nullableString(value.period)
    && nullableString(value.duration) && nullableString(value.premiered)
    && nullableString(value.description) && isProgrammeWork(value);
}

function isPerformance(value: unknown): value is WorkPerformanceResponse {
  return isRecord(value) && isId(value.id) && isString(value.date) && isString(value.time)
    && isOrchestra(value.orchestra) && isVenue(value.venue)
    && nullable(isConductor)(value.conductor);
}

function isWorkInstrument(value: unknown): value is WorkInstrumentResponse {
  return isRecord(value) && isId(value.id) && isString(value.name)
    && nullable(isInteger)(value.quantity) && isString(value.display_label);
}

function isInstrumentGroup(value: unknown): value is InstrumentGroupResponse {
  return isRecord(value) && isId(value.id) && isString(value.name)
    && Array.isArray(value.instruments) && value.instruments.every(isWorkInstrument);
}

export function isWorkDetail(value: unknown): value is WorkDetailResponse {
  return isRecord(value) && Array.isArray(value.performances)
    && value.performances.every(isPerformance)
    && Array.isArray(value.about) && value.about.every(isString)
    && nullableString(value.instrumentation_summary)
    && Array.isArray(value.instrumentation) && value.instrumentation.every(isInstrumentGroup)
    && Array.isArray(value.related_works) && value.related_works.every(isWork)
    && isWork(value);
}

function isProgrammeItem(value: unknown): value is ProgrammeItemResponse {
  return isRecord(value) && isInteger(value.order) && isProgrammeWork(value.work);
}

export function isConcert(value: unknown): value is ConcertResponse {
  return isRecord(value) && Array.isArray(value.programme) && value.programme.every(isProgrammeItem)
    && nullableString(value.ticket_url) && nullableString(value.source_url) && isPerformance(value);
}

export function parseResponse<T>(value: unknown, guard: Guard<T>, label: string): T {
  if (!guard(value)) throw new Error(`Invalid ${label} response from ConcertFinder API`);
  return value;
}

export function parseList<T extends { id: string }>(value: unknown, guard: Guard<T>, label: string): T[] {
  if (!Array.isArray(value) || !value.every(guard)) {
    throw new Error(`Invalid ${label} response from ConcertFinder API`);
  }
  if (new Set(value.map((item) => item.id)).size !== value.length) {
    throw new Error(`Duplicate IDs in ConcertFinder API ${label} response`);
  }
  return value;
}

export function isComposerDetail(value: unknown): value is ComposerDetailResponse {
  return isRecord(value) && Array.isArray(value.works) && value.works.every(isWork)
    && Array.isArray(value.performances) && value.performances.every(isPerformance)
    && isComposer(value);
}
