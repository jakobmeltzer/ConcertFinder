# Backend database and work metadata

Existing database upgrade (does not drop/recreate tables):

```sh
.venv/bin/python migrate_database.py
```

Fresh local database setup, after creating the PostgreSQL `concertfinder` database:

```sh
.venv/bin/python create_tables.py
.venv/bin/python seed_database.py
.venv/bin/python migrate_database.py
.venv/bin/uvicorn app.main:app --reload --port 8000
```

`create_all()` creates missing tables but cannot alter existing columns. Numbered
Python migrations are applied in one PostgreSQL transaction with an advisory lock
and recorded in `schema_migrations`. Rerunning an applied migration is a no-op.
The original full seed remains a one-shot operation for an empty database; do not
run it against an already seeded database. Restart an existing API process after
upgrading so it serves the new response contract.

## Work metadata migration 001

Previously, core metadata existed in Work and both work response schemas, but
`about`, `instrumentationSummary`, grouped `instrumentation`, and `relatedWorks`
existed only in the frontend. All are required by the detail UI. Performances
already came from Concert/ProgrammeItem and remain relational.

- `works.about`: non-null ordered PostgreSQL `TEXT[]`, default empty. Paragraphs
  need ordering, not their own identity or queryable structure.
- `works.instrumentation_summary`: nullable text.
- `instrument_families`: stable string ID and unique display name.
- `instruments`: stable string ID, name, family foreign key and unique family/name.
- `work_instruments`: work/instrument composite key, indexed instrument FK,
  nullable positive quantity, original display label, group order, instrument order.
- `work_relations`: directed work/related-work foreign keys, position and unique
  pair/position constraints. Self-links are disallowed. No recursive API payloads.

Only explicit `N × Name` labels supply a quantity. `1st Violins` is a section name,
not a count; choir/string ensemble sizes remain unknown. Query organ by instrument
name, choir by the relevant instrument IDs/names, or all voices by family. Summing
known quantities is not a total performer count. Labels preserve the original
wording without inventing instrumentation facts or correcting its editorial content.

`seed_data/work_metadata.json` is a backend-owned snapshot copied from the five
existing frontend works. JSON is only the portable seed file format; instruments
and work relations are stored in normalized database tables. The seed/migration
never imports frontend code. The migration backfills existing work IDs, copies
original frontend descriptions and paragraphs, and preserves all other canonical
core values. Missing related targets cause rollback rather than silently losing
recommendations. Works without source metadata receive none.

The backfill and schema changes commit together. The fresh seed uses the same
loader after flushing works. Applied migrations do not overwrite later editorial
changes. Keep the seed snapshot stable; future editorial updates need an explicit
new data migration. There is no automatic destructive downgrade: restore a backup
if a full rollback is needed. Before the local migration a backup was saved at
`/tmp/concertfinder-before-work-metadata.dump` (temporary local file, not committed).

## API and verification

`GET /works/` retains its lightweight shape. `GET /works/{id}` adds ordered About
paragraphs, summary, ordered groups of `{id, name, quantity, display_label}`
instruments, and ordered `related_works` using lightweight WorkResponse objects.
Relationships are eager-loaded. Performances are sorted by date/time/ID and
deduplicated by concert ID; filtering past dates is a frontend display decision.

```sh
.venv/bin/python -m unittest discover -s tests
```

These are integration tests against the migrated, seeded local database. Each test
uses a transaction that rolls back, including test inserts and seed reruns. Tests
cover source fidelity/order for all five works, instrument queries and quantities,
related lookups, lightweight list/404 behavior, empty metadata, repeatable backfill,
and duplicate programme occurrences.

Additional validation completed: fresh table creation/full seed in an isolated
schema rolled back afterwards; migration rerun no-op; live rich responses on the
normal API port 8000; frontend typecheck, lint and webpack production build;
Mahler 2 modal open/Escape dismissal in Chrome; related/performance destinations,
not-found rendering and the works listing. The existing development API process
was restarted to load the updated code.

## Composer/concert detail migration

`GET /composers/{id}` now returns ComposerDetailResponse: biography fields, works
selected by canonical composer ID, and sorted distinct performances selected via
an EXISTS query through programme items/works. Composer lists remain lightweight;
no concert data is duplicated in Composer records. `GET /concerts/{id}` and its
list include programme work year/duration in addition to existing nested entities.
No database changes were required for this phase.

Ten rollback-based integration tests cover metadata and core entity responses,
including empty composers, identity independent of display names, distinct sorted
concerts, repeated programme works/order, nullable conductors, URLs and 404s.
The live ID audit found no orphaned programme/related-work references or tied
programme positions. Future ingestion still needs source-ID deduplication,
immutable assigned-ID/upsert rules, programme-order validation and timezone/unknown
field policy. The current stored primary/foreign keys need no redesign.

## Ingestion stage 1: Vienna Philharmonic dry run

The first ingestion adapter is intentionally read-only. Source-specific code returns
`RawConcert` records and has no dependency on SQLAlchemy models or a database
session. No canonical rows are created by this stage.

Install the new parser dependency, then run a small live dry run from `backend/`:

```sh
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m app.ingestion.sources.vienna_philharmonic --limit 5 --verbose
```

The command fetches the public English Vienna Philharmonic calendar and up to five
concert detail pages, waits one second between detail requests, validates each raw
record, and prints JSON. A non-zero exit code means at least one discovered record
was rejected. Review this JSON before any database-import layer is implemented.

The source event number in the official detail URL is retained as
`source_event_id`; source URL and crawl timestamp are also retained. Event times
are represented as local wall-clock time plus an IANA timezone (`Europe/Vienna`
for this first source). The current canonical `concerts` table is unchanged in
stage 1; source identity/timezone persistence belongs to the import migration once
we have verified live source output.

Parser tests use saved minimal fixtures and never contact the live website:

```sh
.venv/bin/python -m unittest tests.test_ingestion_vienna -v
```

The parser prefers schema.org JSON-LD for date/location when present and falls back
to visible page text. Programme text remains raw (`raw_composer`, `raw_work`): no
canonical work/composer is guessed at crawl time. If the source markup changes,
the dry run should reject/omit fields visibly rather than write bad canonical data.

### Vienna crawler live-page parser update

The first live dry-run exposed three source-specific issues that are now guarded by tests:

- event credits are parsed only from `.programm-info.event`, preventing navigation labels such as `Tradition` from being mistaken for the orchestra;
- programme items are parsed as composer/work pairs from the live `Program` entry and retain source text verbatim;
- touring concerts no longer default to `Europe/Vienna`. Known city/country pairs resolve to an IANA timezone; unknown timed locations are rejected rather than assigned a guessed timezone.

Crawler-import validation also rejects an empty programme. Ticket URLs are read from the event's `.ticket-link` data attributes when the source exposes one; past events can legitimately have no ticket URL.

## Ingestion Stage 2: canonical resolution and safe import

Stage 2 keeps source extraction separate from canonical database writes. A raw record is first
resolved against existing orchestras, venues, conductors, composers and works. Normalized exact
matches and human-approved aliases may resolve automatically; fuzzy similarity is suggestion-only
and never becomes database truth by itself.

Run the migration first:

```bash
.venv/bin/python migrate_database.py
```

Resolve a live Vienna Philharmonic crawl without writing anything:

```bash
.venv/bin/python -m app.ingestion.cli vienna --limit 5
```

The command reports each event as `ready-to-import` or `blocked-unresolved`, including fuzzy
candidate suggestions. A blocked record cannot be imported.

After reviewing an unresolved spelling/title, add a durable alias to an existing canonical entity:

```bash
.venv/bin/python -m app.ingestion.cli add-alias composer gustav-mahler "Mahler, Gustav" --source vienna-philharmonic
.venv/bin/python -m app.ingestion.cli add-alias work mahler-symphony-no-1 "Symphony No. 1 in D Major" --source vienna-philharmonic
```

Aliases never create canonical entities; the target ID must already exist. Once every required
entity resolves, apply inserts/updates transactionally:

```bash
.venv/bin/python -m app.ingestion.cli vienna --limit 5 --write
```

Concert source identity is `(source, source_event_id)`. Re-running the same event plans `skip` when
nothing canonical changed and `update` when source-backed concert fields/programme changed, rather
than inserting a duplicate. Programme positions are unique per concert.

## LLM metadata review

Enable source-backed review before canonical resolution with `--llm`. OpenAI is
the initial provider; the model is configured explicitly. The implementation uses
the Responses API and [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

From `backend/`:

```bash
.venv/bin/pip install -r requirements.txt
export OPENAI_API_KEY='your-api-key'
export INGESTION_LLM_MODEL='your-structured-output-model'

# Review only; no database writes. Report filenames must not already exist.
.venv/bin/python -m app.ingestion.cli vienna --limit 5 --llm --report /tmp/concert-review.json

# Review a fresh crawl and import records that pass review AND canonical resolution.
.venv/bin/python -m app.ingestion.cli vienna --limit 5 --llm --write
```

`--model MODEL` overrides `INGESTION_LLM_MODEL`. `backend/.env.example` lists the
settings; environment files are not loaded automatically. Keys belong only in the
backend environment. Commands without `--llm` keep the deterministic pipeline.

The Vienna adapter now retains page text, JSON-LD event data and the ticket URL
from the same fetched HTML used by the parser. Every parsed concert is reviewed,
including records whose entity names already match the database. The model checks
title, local date/time/timezone, venue/city/country, orchestra, conductor, programme
and ticket link. It may repair extraction errors using quoted source evidence.
It cannot alter the source ID, source URL or crawl timestamp, create canonical
entities, save aliases, or enrich work biographies/instrumentation from memory.

The application validates the response schema, verifies exact evidence excerpts,
checks that text fields and each composer/work occur in their evidence, then runs
normal ingestion validation and canonical resolution. Dates/times are normalized;
IANA timezones may be inferred from the explicitly stated location. Evidence
checks do not prove semantic accuracy: incorrect source information, incomplete
pages and model mistakes still need human review. This is an additional quality
check, not a guarantee that all metadata is correct.

Uncertainty, conflicting evidence, unsupported removals, refusals, incomplete
responses and API errors block that event as `blocked-metadata`. A blocked event
never falls back to importing the original parser output. Missing canonical
entities still use the existing `review-vienna` / `add-alias` workflow. The CLI
exits with code 2 when any event is blocked; other fully resolved events may still
be imported with `--write`.

JSON output includes the original record and source text, proposed metadata,
quotes, changes, issues, source SHA-256, model, response ID and prompt version.
With `--llm --write`, a report is saved automatically under
`backend/ingestion_reports/` (gitignored), or to `--report PATH`. The file is flushed
before the database transaction commits; a report records review decisions and
planned actions, not proof of a successful commit. The path is printed to stderr.
Review-only runs save a report only when `--report` is supplied. A later `--write`
command fetches and reviews again; it does not replay the earlier report.

Each event makes one LLM request, with a 45-second timeout per attempt and at most
two SDK retries for transient failures. Records over 60,000 source characters are
blocked rather than silently truncated. Start with a small `--limit` to assess
cost and quality. Requests use `store=False` and send the public page text and
extracted metadata to OpenAI. No database credentials or API keys enter the prompt.

To add another provider, implement `MetadataReviewer.review(raw) -> ProviderResult`
in `app/ingestion/llm.py` and supply it to `review_metadata`. New crawlers should
populate `RawConcert.source_text` from the fetched event page and call the same
review service before resolution. Parser errors that prevent constructing a
`RawConcert` still need adapter fixes; this stage reviews successfully parsed
records, including records that fail subsequent completeness validation.

Offline tests (mock responses, no API key or PostgreSQL required):

```bash
.venv/bin/python -m unittest tests.test_ingestion_llm tests.test_ingestion_resolution tests.test_ingestion_vienna -v
```
