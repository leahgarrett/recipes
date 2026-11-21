# Recipe Admin Backend

Fastify + TypeScript + Drizzle + Postgres backend for recipe CRUD and JSON export.

## Prerequisites
- Node 20+
- Docker (for Postgres)

## Setup
```bash
cd backend
npm install
cp .env.example .env
docker compose up -d        # start Postgres (creates recipes + recipes_test)
npm run db:migrate          # apply migrations
npm run seed                # load public/recipes.json into the DB
```

## Run
```bash
npm run dev                 # API on http://localhost:8000, Swagger UI at /docs
```

## Workflow
- Edit schema in `src/db/schema.ts` -> `npm run db:generate` -> `npm run db:migrate`.
- Export DB back to the public site: `npm run export` (writes `../public/recipes.json`).
- Tests: `npm test` (uses the `recipes_test` database).

## Notes
- Slugs: `POST /recipes` derives `slug` from the name if you don't send one (`-2`, `-3` on a clash). `PUT` keeps the existing slug unless you send a new one, so renaming doesn't break shared links. Sending a slug another recipe uses returns `409`.
- The test DB (`recipes_test`) is created on first `docker compose up` by `docker/init/01-create-test-db.sql`. If you created the `recipes_pgdata` volume before that file existed, recreate it (`docker compose down -v && docker compose up -d`) so the test DB gets created.
- `npm run export` regenerates `recipes.json` from the database; it validates against the Zod schema before writing and writes atomically. The regenerated file is semantically identical to the seed input but may order JSON keys differently (e.g. `photos` appears after the other recipe fields).

## Layout
- `src/db` — Drizzle schema (source of truth), client, migrate runner
- `src/schemas` — Zod API contract (drives validation + OpenAPI)
- `src/services` — transactional CRUD + nested assembly
- `src/routes` — Fastify routes
- `src/seed`, `src/export` — CLI scripts
