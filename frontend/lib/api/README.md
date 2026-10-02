# Frontend API migration

## Current architecture

`/works`, `/works/[id]`, `/composers/[id]` and `/concerts/[id]` read canonical
FastAPI data through this server-only API layer. They import no mock data and do
not generate entity IDs from names. The temporary `work-links.ts` guard and
`legacy-concert-ids.ts` alias bridge have been deleted.

Server pages fetch and validate responses, map only HTTP 404 to their not-found
view, and let network/server/schema failures reach a retry boundary. Composer and
work interactive views retain Motion/StaggeredContent; the concert view retains
its CSS animations and location section. `PageTransition` is unchanged.

## Configuration and contracts

Set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` in `frontend/.env.local`.
The server-only `CONCERTFINDER_API_URL` takes precedence; blank values fall through
to the next setting, then the local default. Prefer the server-only variable for
runtime/private deployment addresses. `NEXT_PUBLIC_` values are fixed at build time.
All calls run on the Next.js server, so browser CORS is not needed.

- `client.ts`: uncached JSON GETs, eight-second timeout, typed `ApiError` status/path.
- `types.ts` and `validation.ts`: nullable wire contracts and nested runtime checks.
- `works.ts`: `getWorks()` and `getWork(id)`.
- `composers.ts`: `getComposers()` and `getComposer(id)`.
- `concerts.ts`: `getConcerts()` and `getConcert(id)`.

List calls use the backend's trailing slash. Detail IDs are URL-encoded. Null
fields remain explicit; no mock fallback or `any` casts hide API mismatches.

Composer lists remain lightweight. Composer detail adds works and sorted distinct
performances derived through Work → ProgrammeItem → Concert, not stored copies.
The page displays canonical biography, period and available birth/death years;
composers without works still have valid detail pages.

Concert responses contain nested orchestra, venue, optional conductor and ordered
programme work objects, now including year/duration. The detail view preserves
repeated programme works and sorts by programme order; it does not use local
entity lookups. HTTP(S) ticket/source links render when supplied; missing/invalid
links are omitted. Location includes the stored address and existing map placeholder.

Rich work detail includes ordered About paragraphs, normalized grouped
instrumentation, related works and deduplicated performances. See the
[backend README](../../../backend/README.md) for schema/migration setup.

Work and composer pages count/display performances on or after the server's UTC
calendar date. Today is included because venue timezones are not stored. ISO dates
are formatted without date shifts and times display hours/minutes.

## Complete remaining mock-consumer audit

- `app/page.tsx`: imports works, concerts (`concerts`, `getConcertWorks`), orchestras
  (`getOrchestra`) and venues (`getVenue`). Also owns a separate hardcoded featured
  concert array and derives search composer slugs.
- `app/composers/page.tsx`: imports works and `getConcertsForWork`; derives composer
  slugs and counts from mocks.
- `app/data/concerts.ts`: imports `getWork` from `./works` for mock programme lookup.

No other frontend code imports those data files. All four mock files remain.
The six concert fixture ID literals now match the existing canonical database IDs,
so retained homepage search links resolve without a runtime translation bridge.
Other fixture values still differ from the database; the homepage and composer
listing are explicitly not canonical yet. Their three generated composer slugs
match current seeded IDs, but these pages still need migration for new data.

Next migrate `/composers` and `/`, including its separate featured array and search.
Then audit again before deleting data files and the remaining composer slug helper.
Old mock concert URLs intentionally return not-found; no alias/translation remains.

## Identity and crawler readiness

Work, Composer and Concert IDs are stored string primary keys, assigned by the
backend seed and never recomputed during reads or navigation. Tests verify names
can change without changing IDs. ProgrammeItem.work_id and both related-work IDs
are database foreign keys. The live audit found five works, three composers, six
concerts, no orphan work references and no duplicate programme positions.

No ID-system redesign was needed. Current limitations for future ingestion:

- No source/external-ID uniqueness registry, canonical matching or idempotent
  crawler upsert policy. Freeze assigned IDs across title/date changes; do not
  regenerate the seed-style descriptive IDs on every crawl.
- Programme order has no uniqueness/positive-order database constraint. Existing
  rows are unambiguous, but future ingestion must reject tied/invalid positions.
- Concerts require known date, time, venue and orchestra; timezone is absent.
  Unknown fields/timezone handling need an ingestion policy.
- No pagination/filtering for large catalogues yet.

The core UI can display newly inserted valid canonical records without mock guards.
This is read-path readiness, not a completed production crawler ingestion system.

## Validation

Composer increment: TypeScript, ESLint, webpack production build, eight backend
integration tests and live Mahler composer response passed. Concert increment:
same checks, ten backend integration tests, canonical entity journey, nested
programme metadata, unknown-ID handling and identity audit passed. The only lint
warning is the existing SearchBar `aria-expanded` accessibility warning. Build
also reports existing multiple-lockfile workspace-root warning. Webpack is used
because this environment previously blocked Turbopack port binding.

Verified structurally against live API and production pages: Gustav Mahler →
Symphony No. 2 → upcoming Berlin concert → ordered programme → Symphony No. 1 →
Gustav Mahler, plus `/works`, biography/lifespan and not-found handling.

Browser back/forward and visual route-transition verification could not run in
this phase: the computer-control service reports `Sky Computer Use native pipe
startup failed`, including after a reset, with no available surfaces. The route
animation code was not changed; this browser regression check remains outstanding.
