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
