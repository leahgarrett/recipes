# Recipe Admin Backend — Design

**Date:** 2026-07-03
**Status:** Approved (pending spec review)

## Context & Goal

The existing repo root is a public, read-only recipe site (React + Mantine) that reads
`public/recipes.json` and deploys as a static SPA (currently GitHub Pages; S3 is equivalent).
It stays **unchanged**.

The goal is to build a **recipe admin backend**: a locally-run service, backed by Postgres in
Docker, that supports recipe CRUD and can **export a `recipes.json`** to copy into the public
site. This is the first of two sub-projects; a separate **admin SPA** (the "Mission Control"
React 19 + MUI 9 + TanStack Query stack, per `mission-control-stack-spec.md`) will be designed
and built afterward and will consume this backend's API.

This sub-project exists partly as **deliberate practice** of a TypeScript-heavy backend stack.

### Sub-project decomposition
1. **Backend + Postgres + export** (this spec).
2. **Admin SPA** — Mission Control stack, its own spec later. Generates its types from this
   backend's OpenAPI schema.

## Decisions

- **Repo layout — Option B (sibling folders).** The public site stays at the repo root,
  untouched. The backend lives in a self-contained `backend/` folder with its own
  `package.json`, dependencies, and Docker setup. A future `admin/` folder joins it later.
  Rationale: zero risk to the deployed public site, start coding immediately. Migrating to an
  npm-workspaces monorepo (`apps/web`, `apps/api`, `packages/types`) remains a clean future
  upgrade once the admin SPA makes shared tooling worthwhile.

- **Backend framework — Fastify + TypeScript.** Keeps the whole stack in one language, and
  `@fastify/swagger` + `fastify-type-provider-zod` auto-generate the `/openapi.json` the admin
  SPA needs.

- **DB access — Drizzle ORM.** Schema defined in TypeScript (maximizes TS practice), with the
  Django-style model-first migration flow: edit schema → `drizzle-kit generate` (auto SQL
  migration) → `drizzle-kit migrate` (apply). `drizzle-zod` derives Zod schemas from the
  tables.

- **Data model — normalized tables.** Real relational practice (FKs, joins, ordered children)
  rather than a JSONB blob.

- **Types — single source of truth = the Drizzle schema.** `drizzle-zod` generates Zod schemas
  (request validation + OpenAPI); the admin SPA generates its client types from the resulting
  OpenAPI schema. No hand-duplication across layers. The public site keeps its own read-model
  `Recipe` type; the export step guarantees agreement by **validating exported data against the
  Zod schema** before writing — a stronger guarantee than a shared type declaration, because it
  checks real data.

- **Export — CLI script** (`npm run export`), not an HTTP endpoint, for now.

- **Auth — none for now.** Local-only. CORS will allow the admin SPA dev origin. Real auth is
  an open decision deferred to the admin SPA.

- **Seed — from the existing `public/recipes.json`.**

## Type & Data Flow

```
Drizzle schema (src/db/schema.ts)  ── source of truth
   ├─ Drizzle client ............... DB access
   └─ drizzle-zod → Zod schemas .... request validation + OpenAPI
                                        └─ /openapi.json → admin SPA generated types

DB ─ export.ts (validate vs Zod) → public/recipes.json → public site (own Recipe type)
```

## Database Schema (normalized, Postgres 16)

| Table | Columns |
|-------|---------|
| `recipes` | `id` (uuid, pk) · `name` · `servings` (int) · `prep_time` · `cook_time` · `category` · `description` · `created_at` · `updated_at` |
| `ingredients` | `id` (pk) · `recipe_id` (fk→recipes, cascade) · `item` · `amount` (numeric) · `unit` · `position` (int) |
| `steps` | `id` (pk) · `recipe_id` (fk→recipes, cascade) · `instruction` · `type` (enum) · `position` (int) |
| `photos` | `id` (pk) · `recipe_id` (fk→recipes, cascade, nullable) · `step_id` (fk→steps, cascade, nullable) · `url` · `alt` · `caption` (nullable) · `position` (int) |

- **Ordering:** `position` columns preserve array order for ingredients, steps, and a step's or
  recipe's photos.
- **Step type enum:** `prep | cook | bake | rest | serve | mix | other` (Postgres enum,
  mirrored by a Zod enum).
- **Photo ownership:** a photo belongs to **exactly one** of a recipe or a step. Enforced with
  nullable `recipe_id`/`step_id` plus a check constraint that exactly one is non-null. Mirrors
  the current `Recipe.photos` and `Step.photos`.
- **IDs:** recipe PKs are UUIDs; the API exposes `id` as a string (matching the public site).
  The 10 seeded recipes retain their existing `"1"`–`"10"` ids. Child rows use their own PKs and
  are never surfaced in the export (children are nested arrays without ids).

## API

Validated with Zod via `fastify-type-provider-zod`; every route contributes to `/openapi.json`.

| Method & path | Purpose |
|---------------|---------|
| `GET /health` | Liveness check |
| `GET /recipes` | List all recipes (nested) |
| `GET /recipes/:id` | One recipe, assembled with nested ingredients/steps/photos |
| `POST /recipes` | Create a recipe + children |
| `PUT /recipes/:id` | Replace a recipe + children |
| `DELETE /recipes/:id` | Delete a recipe (children cascade) |
| `GET /openapi.json`, `GET /docs` | OpenAPI schema + Swagger UI |

- **Writes are transactional:** a recipe and all its children are inserted/replaced atomically.
- The nested request/response shape matches the current `Recipe` interface
  (`src/types/Recipe.ts`).

## Export

`npm run export`:
1. Read all recipes from Postgres, assembling the nested shape (ordered by `position`).
2. Validate the assembled `{ recipes: [...] }` against the Zod export schema.
3. On success, write `../public/recipes.json`. On validation failure, exit non-zero with a
   clear error and write nothing.

Target path is overridable via env/flag but defaults to the public site's `recipes.json`.

## Seed

`npm run seed`:
- Reads the existing `../public/recipes.json`.
- Inserts recipes + children into Postgres, preserving ids and array order.
- Idempotent (reset-then-insert) so it can be re-run safely.

## Testing

Vitest integration tests against a Postgres test database:
- CRUD round-trips (create → read back nested → update → delete).
- The exactly-one-photo-owner check constraint.
- Export output validates against the Zod schema and round-trips a seeded recipe.

Meaningful coverage in keeping with the repo's testing ethos, not a percentage target.

## Folder Layout

```text
backend/
  docker-compose.yml        # postgres 16
  package.json
  tsconfig.json
  drizzle.config.ts
  .env.example              # DATABASE_URL, EXPORT_PATH
  src/
    db/
      schema.ts             # Drizzle tables — source of truth
      client.ts             # Drizzle client / pool
      migrate.ts            # apply migrations
    schemas/
      recipe.ts             # drizzle-zod schemas + export schema
    routes/
      recipes.ts
      health.ts
    services/
      recipes.ts            # assemble + transactional writes
    export/
      export.ts             # CLI: DB → recipes.json
    seed/
      seed.ts               # recipes.json → DB
    app.ts                  # build Fastify app (swagger, zod provider, routes)
    server.ts               # start server
  drizzle/                  # generated migration files
  test/
```

### npm scripts (backend)
`dev` (tsx watch server) · `build` (tsc) · `start` · `db:generate` (drizzle-kit generate) ·
`db:migrate` · `db:push` · `seed` · `export` · `test` (vitest) · `typecheck`.

## Out of Scope (this sub-project)

- The admin SPA (separate spec).
- Authentication / authorization.
- Deploying the backend anywhere (local-only for now).
- Image upload/hosting (photos remain URLs, as today).
- Migrating the repo to an npm-workspaces monorepo.
