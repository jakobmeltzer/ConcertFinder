# Frontend API migration

The Works listing fetches `GET /works/` from FastAPI on the Next.js server.
Set `CONCERTFINDER_API_URL=http://127.0.0.1:8000` in `frontend/.env.local`
(or deployment environment). The default is that same local address. The URL
must be reachable from the Next.js server; no browser CORS setup is required.

Run the existing PostgreSQL database and, from `backend`, start FastAPI with
`.venv/bin/uvicorn app.main:app --port 8000`. Database creation and seeding are
separate setup steps; the frontend never writes or seeds the database.

Responses are validated, uncached, and limited to an eight-second fetch timeout.
Failures show a retry page; an empty response shows an empty catalogue. There is
no mock-data fallback. Composer filters and search use API results. Performance
counts are omitted because the list endpoint does not supply them.

## Temporary detail-route boundary

Work and composer detail pages still use local data. All five seeded API work
IDs match their local routes, and composer IDs match the existing slug routes.
`assertWorkLinks` checks each response against those existing routes and fails
explicitly if an unsupported ID appears, instead of publishing broken links.
This means adding a new backend work requires migrating its detail route first.
Local data is used here only to validate links, never to populate the listing.

Next: migrate work details, preserving richer metadata and instrumentation;
then composer details. Remove the compatibility check once both use the API.
Concert IDs differ between backend seeds and local data, so concert links need
a separate migration before using API performance links.
