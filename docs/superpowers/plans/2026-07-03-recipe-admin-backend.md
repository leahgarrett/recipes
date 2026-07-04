# Recipe Admin Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally-run Fastify + TypeScript backend, backed by Postgres in Docker, that supports recipe CRUD and exports a `recipes.json` for the public site.

**Architecture:** A self-contained `backend/` folder (repo root untouched). Drizzle ORM defines a normalized schema in TypeScript and is the source of truth; Zod schemas define the API contract and drive `/openapi.json` via `fastify-type-provider-zod`. A CLI seed script loads the existing `public/recipes.json` into Postgres; a CLI export script writes it back out after validating against the Zod schema.

**Tech Stack:** Node 20+, Fastify 5, Drizzle ORM + drizzle-kit, Postgres 16 (Docker), Zod, `@fastify/swagger`, Vitest.

---

## Reference: current data shape

The public site's `src/types/Recipe.ts` defines the target shape. The API and export must match it exactly:

```ts
interface Ingredient { item: string; amount: number; unit: string; }
interface Photo { url: string; alt: string; caption?: string; }
type StepType = 'prep' | 'cook' | 'bake' | 'rest' | 'serve' | 'mix' | 'other';
interface Step { instruction: string; type: StepType; photos?: Photo[]; }
interface Recipe {
  id: string; name: string; servings: number; prepTime: string; cookTime: string;
  category: string; description: string; photos?: Photo[];
  ingredients: Ingredient[]; instructions: Step[];
}
interface RecipesData { recipes: Recipe[]; }
```

**Implementation note (deviation from spec, intentional):**
- `amount` is stored as `double precision`, not `numeric`. Drizzle's `numeric` returns a string at runtime, which fights the `amount: number` contract. `double precision` returns a JS number and is more than precise enough for recipe quantities.
- Recipe `id` is a **`text`** primary key (not native `uuid`), so the seeded recipes can keep their existing `"1"`–`"10"` ids while new recipes get an app-generated UUID string. This satisfies "API exposes id as a string" without a type conflict.

---

## Task 0: Scaffold the backend folder

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`
- Create: `backend/docker-compose.yml`
- Create: `backend/docker/init/01-create-test-db.sql`
- Create: `backend/drizzle.config.ts`

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "recipe-admin-backend",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": ">=20" },
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:push": "drizzle-kit push",
    "seed": "tsx src/seed/seed.ts",
    "export": "tsx src/export/export.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "@fastify/swagger": "^9.4.0",
    "@fastify/swagger-ui": "^5.2.0",
    "drizzle-orm": "^0.36.4",
    "fastify": "^5.2.0",
    "fastify-type-provider-zod": "^4.0.2",
    "pg": "^8.13.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/pg": "^8.11.10",
    "drizzle-kit": "^0.28.1",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `backend/.env.example`**

```bash
# Local dev database (matches docker-compose.yml)
DATABASE_URL=postgres://recipes:recipes@localhost:5432/recipes
# Test database (created by docker/init/01-create-test-db.sql)
TEST_DATABASE_URL=postgres://recipes:recipes@localhost:5432/recipes_test
# Where `npm run export` writes the JSON (defaults to the public site)
EXPORT_PATH=../public/recipes.json
```

- [ ] **Step 4: Create `backend/.gitignore`**

```gitignore
node_modules
dist
.env
```

- [ ] **Step 5: Create `backend/docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: recipes
      POSTGRES_PASSWORD: recipes
      POSTGRES_DB: recipes
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U recipes -d recipes"]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - recipes_pgdata:/var/lib/postgresql/data
      - ./docker/init:/docker-entrypoint-initdb.d
volumes:
  recipes_pgdata:
```

- [ ] **Step 6: Create `backend/docker/init/01-create-test-db.sql`**

```sql
CREATE DATABASE recipes_test;
```

- [ ] **Step 7: Create `backend/drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://recipes:recipes@localhost:5432/recipes',
  },
});
```

- [ ] **Step 8: Install dependencies**

Run: `cd backend && npm install`
Expected: `node_modules` created, no errors. If Drizzle version mismatches appear later, align `drizzle-orm` / `drizzle-kit` to the same minor.

- [ ] **Step 9: Start Postgres and verify**

Run: `cd backend && docker compose up -d && sleep 3 && docker compose exec db psql -U recipes -d recipes -c '\l'`
Expected: both `recipes` and `recipes_test` databases listed.

- [ ] **Step 10: Copy env file**

Run: `cd backend && cp .env.example .env`
Expected: `.env` exists.

- [ ] **Step 11: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/tsconfig.json backend/.env.example backend/.gitignore backend/docker-compose.yml backend/docker backend/drizzle.config.ts
git commit -m "chore(backend): scaffold Fastify + Postgres backend folder"
```

---

## Task 1: Drizzle schema and migration

**Files:**
- Create: `backend/src/db/schema.ts`
- Create: `backend/src/db/client.ts`
- Create: `backend/src/db/migrate.ts`

- [ ] **Step 1: Create `backend/src/db/schema.ts`**

```ts
import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, text, integer, doublePrecision, timestamp, serial, check, index,
} from 'drizzle-orm/pg-core';

export const stepTypeEnum = pgEnum('step_type', [
  'prep', 'cook', 'bake', 'rest', 'serve', 'mix', 'other',
]);

export const recipes = pgTable('recipes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  servings: integer('servings').notNull(),
  prepTime: text('prep_time').notNull(),
  cookTime: text('cook_time').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  item: text('item').notNull(),
  amount: doublePrecision('amount').notNull(),
  unit: text('unit').notNull(),
  position: integer('position').notNull(),
}, (t) => [
  index('ingredients_recipe_id_idx').on(t.recipeId),
]);

export const steps = pgTable('steps', {
  id: serial('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  instruction: text('instruction').notNull(),
  type: stepTypeEnum('type').notNull(),
  position: integer('position').notNull(),
}, (t) => [
  index('steps_recipe_id_idx').on(t.recipeId),
]);

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  recipeId: text('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  stepId: integer('step_id').references(() => steps.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: text('alt').notNull(),
  caption: text('caption'),
  position: integer('position').notNull(),
}, (t) => [
  check(
    'photo_owner_check',
    sql`(${t.recipeId} IS NOT NULL AND ${t.stepId} IS NULL) OR (${t.recipeId} IS NULL AND ${t.stepId} IS NOT NULL)`,
  ),
  index('photos_recipe_id_idx').on(t.recipeId),
  index('photos_step_id_idx').on(t.stepId),
]);
```

- [ ] **Step 2: Create `backend/src/db/client.ts`**

```ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://recipes:recipes@localhost:5432/recipes';

export const pool = new Pool({ connectionString });
pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
});
export const db = drizzle(pool, { schema });
export type DB = typeof db;
```

- [ ] **Step 3: Create `backend/src/db/migrate.ts`**

```ts
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.js';

async function main() {
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
  console.log('Migrations applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Generate the migration**

Run: `cd backend && npm run db:generate`
Expected: a new SQL file under `backend/drizzle/` containing `CREATE TABLE`, the `step_type` enum, and the `photo_owner_check` constraint.

- [ ] **Step 5: Apply the migration**

Run: `cd backend && npm run db:migrate`
Expected: `Migrations applied.` printed, no errors.

- [ ] **Step 6: Verify tables exist**

Run: `cd backend && docker compose exec db psql -U recipes -d recipes -c '\dt'`
Expected: `recipes`, `ingredients`, `steps`, `photos` tables listed.

- [ ] **Step 7: Commit**

```bash
git add backend/src/db backend/drizzle
git commit -m "feat(backend): add normalized Drizzle schema and initial migration"
```

---

## Task 2: Zod API schemas (the contract)

**Files:**
- Create: `backend/src/schemas/recipe.ts`
- Test: `backend/test/schemas/recipe.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { recipeSchema, recipeInputSchema, recipesDataSchema } from '../../src/schemas/recipe.js';

const validRecipe = {
  id: '1',
  name: 'Fluffy Pancakes',
  servings: 4,
  prepTime: '10 minutes',
  cookTime: '30 minutes',
  category: 'Breakfast',
  description: 'Classic fluffy pancakes',
  ingredients: [{ item: 'flour', amount: 2, unit: 'cups' }],
  instructions: [{ instruction: 'Mix', type: 'mix' as const }],
};

describe('recipe schemas', () => {
  it('accepts a valid recipe', () => {
    expect(recipeSchema.parse(validRecipe)).toEqual(validRecipe);
  });

  it('rejects an invalid step type', () => {
    const bad = { ...validRecipe, instructions: [{ instruction: 'x', type: 'fry' }] };
    expect(() => recipeSchema.parse(bad)).toThrow();
  });

  it('input schema omits id', () => {
    expect('id' in recipeInputSchema.shape).toBe(false);
  });

  it('recipesData wraps an array', () => {
    expect(recipesDataSchema.parse({ recipes: [validRecipe] }).recipes).toHaveLength(1);
  });

  it('rejects a negative servings value', () => {
    const bad = { ...validRecipe, servings: -1 };
    expect(() => recipeSchema.parse(bad)).toThrow();
  });

  it('rejects a non-integer servings value', () => {
    const bad = { ...validRecipe, servings: 1.5 };
    expect(() => recipeSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/schemas/recipe.test.ts`
Expected: FAIL — cannot resolve `../../src/schemas/recipe.js`.

- [ ] **Step 3: Create `backend/src/schemas/recipe.ts`**

```ts
import { z } from 'zod';

export const photoSchema = z.object({
  url: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

export const ingredientSchema = z.object({
  item: z.string(),
  amount: z.number(),
  unit: z.string(),
});

export const stepTypeSchema = z.enum([
  'prep', 'cook', 'bake', 'rest', 'serve', 'mix', 'other',
]);

export const stepSchema = z.object({
  instruction: z.string(),
  type: stepTypeSchema,
  photos: z.array(photoSchema).optional(),
});

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  servings: z.number().int().positive(),
  prepTime: z.string(),
  cookTime: z.string(),
  category: z.string(),
  description: z.string(),
  photos: z.array(photoSchema).optional(),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(stepSchema),
});

export const recipeInputSchema = recipeSchema.omit({ id: true });
export const recipesDataSchema = z.object({ recipes: z.array(recipeSchema) });

export const recipeParamsSchema = z.object({ id: z.string() });

export type Photo = z.infer<typeof photoSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run test/schemas/recipe.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/schemas backend/test/schemas
git commit -m "feat(backend): add Zod recipe schemas as the API contract"
```

---

## Task 3: Test infrastructure (test DB + reset)

**Files:**
- Create: `backend/vitest.config.ts`
- Create: `backend/test/global-setup.ts`
- Create: `backend/test/helpers/db.ts`

- [ ] **Step 1: Create `backend/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./test/global-setup.ts'],
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgres://recipes:recipes@localhost:5432/recipes_test',
    },
    fileParallelism: false,
  },
});
```

- [ ] **Step 2: Create `backend/test/global-setup.ts`**

This runs migrations against the test database once before the suite.

```ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export default async function setup() {
  const connectionString =
    process.env.TEST_DATABASE_URL ??
    'postgres://recipes:recipes@localhost:5432/recipes_test';
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
}
```

- [ ] **Step 3: Create `backend/test/helpers/db.ts`**

`resetDb` truncates all tables between tests; `RESTART IDENTITY` resets serial ids so tests are deterministic.

```ts
import { db } from '../../src/db/client.js';
import { sql } from 'drizzle-orm';

export async function resetDb() {
  // Safety guard: refuse to truncate anything but a test database, independent of
  // how DATABASE_URL was configured. TRUNCATE is irreversible.
  const result = await db.execute<{ current_database: string }>(
    sql`SELECT current_database()`,
  );
  const dbName = result.rows[0]?.current_database;
  if (!dbName || !dbName.includes('test')) {
    throw new Error(
      `resetDb() refused to run: connected database "${dbName}" is not a test database`,
    );
  }
  await db.execute(
    sql`TRUNCATE TABLE photos, steps, ingredients, recipes RESTART IDENTITY CASCADE`,
  );
}
```

- [ ] **Step 4: Verify the harness runs**

Run: `cd backend && npx vitest run test/schemas/recipe.test.ts`
Expected: PASS — confirms `globalSetup` migrates the test DB without errors before tests run.

- [ ] **Step 5: Commit**

```bash
git add backend/vitest.config.ts backend/test/global-setup.ts backend/test/helpers
git commit -m "test(backend): add test DB migration and reset harness"
```

---

## Task 4: Recipe service (CRUD + assembly)

**Files:**
- Create: `backend/src/services/recipes.ts`
- Test: `backend/test/services/recipes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from '../helpers/db.js';
import {
  createRecipe, getRecipe, listRecipes, updateRecipe, deleteRecipe,
} from '../../src/services/recipes.js';
import type { RecipeInput } from '../../src/schemas/recipe.js';

const input: RecipeInput = {
  name: 'Fluffy Pancakes',
  servings: 4,
  prepTime: '10 minutes',
  cookTime: '30 minutes',
  category: 'Breakfast',
  description: 'Classic fluffy pancakes',
  photos: [{ url: 'https://example.com/p.png', alt: 'pancakes', caption: 'yum' }],
  ingredients: [
    { item: 'flour', amount: 2, unit: 'cups' },
    { item: 'eggs', amount: 2, unit: '' },
  ],
  instructions: [
    { instruction: 'Mix dry', type: 'mix' },
    {
      instruction: 'Cook on griddle',
      type: 'cook',
      photos: [{ url: 'https://example.com/s.png', alt: 'cooking' }],
    },
  ],
};

describe('recipe service', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('creates and reads back a recipe with nested children in order', async () => {
    const created = await createRecipe(input);
    expect(created.id).toBeTruthy();
    const fetched = await getRecipe(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.ingredients).toEqual(input.ingredients);
    expect(fetched!.instructions[0].type).toBe('mix');
    expect(fetched!.instructions[1].photos).toEqual(input.instructions[1].photos);
    expect(fetched!.photos).toEqual(input.photos);
  });

  it('preserves an explicit id when provided (for seeding)', async () => {
    const created = await createRecipe(input, '1');
    expect(created.id).toBe('1');
  });

  it('lists all recipes', async () => {
    await createRecipe(input, 'a');
    await createRecipe(input, 'b');
    const all = await listRecipes();
    expect(all).toHaveLength(2);
  });

  it('replaces children on update', async () => {
    const created = await createRecipe(input, '1');
    const updated = await updateRecipe('1', {
      ...input,
      name: 'Renamed',
      ingredients: [{ item: 'milk', amount: 1, unit: 'cup' }],
    });
    expect(updated!.name).toBe('Renamed');
    expect(updated!.ingredients).toEqual([{ item: 'milk', amount: 1, unit: 'cup' }]);
  });

  it('returns null when updating a missing recipe', async () => {
    expect(await updateRecipe('nope', input)).toBeNull();
  });

  it('deletes a recipe and cascades children', async () => {
    await createRecipe(input, '1');
    expect(await deleteRecipe('1')).toBe(true);
    expect(await getRecipe('1')).toBeNull();
    expect(await deleteRecipe('1')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/services/recipes.test.ts`
Expected: FAIL — cannot resolve `../../src/services/recipes.js`.

- [ ] **Step 3: Create `backend/src/services/recipes.ts`**

```ts
import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { recipes, ingredients, steps, photos } from '../db/schema.js';
import type { Photo, Recipe, RecipeInput } from '../schemas/recipe.js';

type PhotoRow = typeof photos.$inferSelect;

function mapPhoto(row: PhotoRow): Photo {
  const photo: Photo = { url: row.url, alt: row.alt };
  if (row.caption !== null) photo.caption = row.caption;
  return photo;
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const [row] = await db.select().from(recipes).where(eq(recipes.id, id));
  if (!row) return null;

  const ingRows = await db.select().from(ingredients)
    .where(eq(ingredients.recipeId, id)).orderBy(asc(ingredients.position));
  const stepRows = await db.select().from(steps)
    .where(eq(steps.recipeId, id)).orderBy(asc(steps.position));
  const recipePhotoRows = await db.select().from(photos)
    .where(eq(photos.recipeId, id)).orderBy(asc(photos.position));

  const instructions = await Promise.all(stepRows.map(async (s) => {
    const stepPhotoRows = await db.select().from(photos)
      .where(eq(photos.stepId, s.id)).orderBy(asc(photos.position));
    const step: Recipe['instructions'][number] = { instruction: s.instruction, type: s.type };
    if (stepPhotoRows.length) step.photos = stepPhotoRows.map(mapPhoto);
    return step;
  }));

  const recipe: Recipe = {
    id: row.id,
    name: row.name,
    servings: row.servings,
    prepTime: row.prepTime,
    cookTime: row.cookTime,
    category: row.category,
    description: row.description,
    ingredients: ingRows.map((i) => ({ item: i.item, amount: i.amount, unit: i.unit })),
    instructions,
  };
  if (recipePhotoRows.length) recipe.photos = recipePhotoRows.map(mapPhoto);
  return recipe;
}

export async function listRecipes(): Promise<Recipe[]> {
  const rows = await db.select({ id: recipes.id }).from(recipes)
    .orderBy(asc(recipes.createdAt), asc(recipes.id));
  const result: Recipe[] = [];
  for (const { id } of rows) {
    const recipe = await getRecipe(id);
    if (recipe) result.push(recipe);
  }
  return result;
}

async function insertChildren(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  id: string,
  input: RecipeInput,
) {
  if (input.ingredients.length) {
    await tx.insert(ingredients).values(
      input.ingredients.map((ing, idx) => ({
        recipeId: id, item: ing.item, amount: ing.amount, unit: ing.unit, position: idx,
      })),
    );
  }
  for (const [idx, step] of input.instructions.entries()) {
    const [insertedStep] = await tx.insert(steps).values({
      recipeId: id, instruction: step.instruction, type: step.type, position: idx,
    }).returning({ id: steps.id });
    if (step.photos?.length) {
      await tx.insert(photos).values(
        step.photos.map((p, pIdx) => ({
          stepId: insertedStep.id, url: p.url, alt: p.alt,
          caption: p.caption ?? null, position: pIdx,
        })),
      );
    }
  }
  if (input.photos?.length) {
    await tx.insert(photos).values(
      input.photos.map((p, idx) => ({
        recipeId: id, url: p.url, alt: p.alt, caption: p.caption ?? null, position: idx,
      })),
    );
  }
}

export async function createRecipe(input: RecipeInput, id: string = randomUUID()): Promise<Recipe> {
  await db.transaction(async (tx) => {
    await tx.insert(recipes).values({
      id, name: input.name, servings: input.servings, prepTime: input.prepTime,
      cookTime: input.cookTime, category: input.category, description: input.description,
    });
    await insertChildren(tx, id, input);
  });
  return (await getRecipe(id))!;
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<Recipe | null> {
  const [existing] = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.id, id));
  if (!existing) return null;

  await db.transaction(async (tx) => {
    await tx.update(recipes).set({
      name: input.name, servings: input.servings, prepTime: input.prepTime,
      cookTime: input.cookTime, category: input.category, description: input.description,
      updatedAt: new Date(),
    }).where(eq(recipes.id, id));
    // Children cascade-delete via the recipe FK only on recipe delete, so clear them explicitly.
    await tx.delete(photos).where(eq(photos.recipeId, id));
    await tx.delete(steps).where(eq(steps.recipeId, id)); // step photos cascade via step FK
    await tx.delete(ingredients).where(eq(ingredients.recipeId, id));
    await insertChildren(tx, id, input);
  });
  return getRecipe(id);
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const deleted = await db.delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id });
  return deleted.length > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run test/services/recipes.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/services backend/test/services
git commit -m "feat(backend): add recipe service with transactional CRUD"
```

---

## Task 5: Fastify app and routes

**Files:**
- Create: `backend/src/routes/health.ts`
- Create: `backend/src/routes/recipes.ts`
- Create: `backend/src/app.ts`
- Test: `backend/test/routes/recipes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../helpers/db.js';
import { buildApp } from '../../src/app.js';
import type { RecipeInput } from '../../src/schemas/recipe.js';

const app = await buildApp();

const input: RecipeInput = {
  name: 'Fluffy Pancakes',
  servings: 4,
  prepTime: '10 minutes',
  cookTime: '30 minutes',
  category: 'Breakfast',
  description: 'Classic fluffy pancakes',
  ingredients: [{ item: 'flour', amount: 2, unit: 'cups' }],
  instructions: [{ instruction: 'Mix', type: 'mix' }],
};

describe('recipe routes', () => {
  beforeEach(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('POST then GET a recipe round-trips', async () => {
    const create = await app.inject({ method: 'POST', url: '/recipes', payload: input });
    expect(create.statusCode).toBe(201);
    const id = create.json().id as string;

    const get = await app.inject({ method: 'GET', url: `/recipes/${id}` });
    expect(get.statusCode).toBe(200);
    expect(get.json().name).toBe('Fluffy Pancakes');
  });

  it('GET /recipes/:id returns 404 for missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/recipes/nope' });
    expect(res.statusCode).toBe(404);
  });

  it('POST with an invalid body returns 400', async () => {
    const res = await app.inject({
      method: 'POST', url: '/recipes', payload: { ...input, servings: -1 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE removes a recipe', async () => {
    const create = await app.inject({ method: 'POST', url: '/recipes', payload: input });
    const id = create.json().id as string;
    const del = await app.inject({ method: 'DELETE', url: `/recipes/${id}` });
    expect(del.statusCode).toBe(204);
    const get = await app.inject({ method: 'GET', url: `/recipes/${id}` });
    expect(get.statusCode).toBe(404);
  });

  it('exposes an OpenAPI schema', async () => {
    const res = await app.inject({ method: 'GET', url: '/openapi.json' });
    expect(res.statusCode).toBe(200);
    expect(res.json().paths['/recipes']).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/routes/recipes.test.ts`
Expected: FAIL — cannot resolve `../../src/app.js`.

- [ ] **Step 3: Create `backend/src/routes/health.ts`**

```ts
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/health', {
    schema: { response: { 200: z.object({ status: z.literal('ok') }) } },
  }, async () => ({ status: 'ok' as const }));
}
```

- [ ] **Step 4: Create `backend/src/routes/recipes.ts`**

```ts
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  recipeSchema, recipeInputSchema, recipeParamsSchema,
} from '../schemas/recipe.js';
import {
  createRecipe, getRecipe, listRecipes, updateRecipe, deleteRecipe,
} from '../services/recipes.js';

export async function registerRecipeRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get('/recipes', {
    schema: { response: { 200: z.array(recipeSchema) } },
  }, async () => listRecipes());

  r.get('/recipes/:id', {
    schema: { params: recipeParamsSchema, response: { 200: recipeSchema } },
  }, async (req, reply) => {
    const recipe = await getRecipe(req.params.id);
    if (!recipe) return reply.code(404).send({ message: 'Recipe not found' });
    return recipe;
  });

  r.post('/recipes', {
    schema: { body: recipeInputSchema, response: { 201: recipeSchema } },
  }, async (req, reply) => {
    const created = await createRecipe(req.body);
    return reply.code(201).send(created);
  });

  r.put('/recipes/:id', {
    schema: { params: recipeParamsSchema, body: recipeInputSchema, response: { 200: recipeSchema } },
  }, async (req, reply) => {
    const updated = await updateRecipe(req.params.id, req.body);
    if (!updated) return reply.code(404).send({ message: 'Recipe not found' });
    return updated;
  });

  r.delete('/recipes/:id', {
    schema: { params: recipeParamsSchema, response: { 204: z.null() } },
  }, async (req, reply) => {
    const ok = await deleteRecipe(req.params.id);
    if (!ok) return reply.code(404).send({ message: 'Recipe not found' });
    return reply.code(204).send();
  });
}
```

- [ ] **Step 5: Create `backend/src/app.ts`**

```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler, validatorCompiler, jsonSchemaTransform,
} from 'fastify-type-provider-zod';
import { registerHealthRoutes } from './routes/health.js';
import { registerRecipeRoutes } from './routes/recipes.js';

export async function buildApp() {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: true });
  await app.register(swagger, {
    openapi: { info: { title: 'Recipe Admin API', version: '1.0.0' } },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  await app.register(registerHealthRoutes);
  await app.register(registerRecipeRoutes);

  await app.ready();
  return app;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx vitest run test/routes/recipes.test.ts`
Expected: PASS (6 tests). If the OpenAPI test fails on the `/openapi.json` route, confirm `@fastify/swagger` is registered before `app.ready()`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes backend/src/app.ts backend/test/routes
git commit -m "feat(backend): add Fastify app, recipe routes, and OpenAPI schema"
```

---

## Task 6: Seed script

**Files:**
- Create: `backend/src/seed/seed.ts`
- Test: `backend/test/seed/seed.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from '../helpers/db.js';
import { seedFromData } from '../../src/seed/seed.js';
import { listRecipes } from '../../src/services/recipes.js';

const data = {
  recipes: [
    {
      id: '1', name: 'Pancakes', servings: 4, prepTime: '10 minutes',
      cookTime: '30 minutes', category: 'Breakfast', description: 'Fluffy',
      ingredients: [{ item: 'flour', amount: 2, unit: 'cups' }],
      instructions: [{ instruction: 'Mix', type: 'mix' as const }],
    },
  ],
};

describe('seed', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('loads recipes preserving ids and is re-runnable', async () => {
    await seedFromData(data);
    await seedFromData(data); // idempotent: reset-then-insert
    const all = await listRecipes();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/seed/seed.test.ts`
Expected: FAIL — cannot resolve `../../src/seed/seed.js`.

- [ ] **Step 3: Create `backend/src/seed/seed.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import { db, pool } from '../db/client.js';
import { photos, steps, ingredients, recipes } from '../db/schema.js';
import { createRecipe } from '../services/recipes.js';
import { recipesDataSchema } from '../schemas/recipe.js';
import type { z } from 'zod';

type RecipesData = z.infer<typeof recipesDataSchema>;

export async function seedFromData(data: RecipesData): Promise<void> {
  const parsed = recipesDataSchema.parse(data);
  await db.execute(
    sql`TRUNCATE TABLE ${photos}, ${steps}, ${ingredients}, ${recipes} RESTART IDENTITY CASCADE`,
  );
  for (const recipe of parsed.recipes) {
    const { id, ...input } = recipe;
    await createRecipe(input, id);
  }
}

async function main() {
  const path = fileURLToPath(new URL('../../../public/recipes.json', import.meta.url));
  const raw = await readFile(path, 'utf-8');
  const data = recipesDataSchema.parse(JSON.parse(raw));
  await seedFromData(data);
  await pool.end();
  console.log(`Seeded ${data.recipes.length} recipes.`);
}

// Run as a CLI only (not when imported by tests).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run test/seed/seed.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Seed the real dev database**

Run: `cd backend && npm run seed`
Expected: `Seeded 10 recipes.`

- [ ] **Step 6: Commit**

```bash
git add backend/src/seed backend/test/seed
git commit -m "feat(backend): add seed script loading public/recipes.json into Postgres"
```

---

## Task 7: Export script

**Files:**
- Create: `backend/src/export/export.ts`
- Test: `backend/test/export/export.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resetDb } from '../helpers/db.js';
import { exportToFile } from '../../src/export/export.js';
import { createRecipe } from '../../src/services/recipes.js';
import { recipesDataSchema } from '../../src/schemas/recipe.js';

const outPath = join(tmpdir(), 'recipes-export-test.json');

describe('export', () => {
  beforeEach(async () => {
    await resetDb();
  });
  afterEach(async () => {
    await rm(outPath, { force: true });
  });

  it('writes schema-valid JSON of all recipes', async () => {
    await createRecipe({
      name: 'Pancakes', servings: 4, prepTime: '10 minutes', cookTime: '30 minutes',
      category: 'Breakfast', description: 'Fluffy',
      ingredients: [{ item: 'flour', amount: 2, unit: 'cups' }],
      instructions: [{ instruction: 'Mix', type: 'mix' }],
    }, '1');

    await exportToFile(outPath);

    const written = JSON.parse(await readFile(outPath, 'utf-8'));
    expect(() => recipesDataSchema.parse(written)).not.toThrow();
    expect(written.recipes[0].id).toBe('1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/export/export.test.ts`
Expected: FAIL — cannot resolve `../../src/export/export.js`.

- [ ] **Step 3: Create `backend/src/export/export.ts`**

```ts
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/client.js';
import { listRecipes } from '../services/recipes.js';
import { recipesDataSchema } from '../schemas/recipe.js';

export async function exportToFile(outPath: string): Promise<number> {
  const recipes = await listRecipes();
  // Validate real data against the contract before writing — fails loudly on drift.
  const data = recipesDataSchema.parse({ recipes });
  await writeFile(outPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  return data.recipes.length;
}

async function main() {
  const outPath =
    process.env.EXPORT_PATH ??
    fileURLToPath(new URL('../../../public/recipes.json', import.meta.url));
  const count = await exportToFile(outPath);
  await pool.end();
  console.log(`Exported ${count} recipes to ${outPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run test/export/export.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add backend/src/export backend/test/export
git commit -m "feat(backend): add export script that validates against the schema"
```

---

## Task 8: Server entrypoint, README, and full verification

**Files:**
- Create: `backend/src/server.ts`
- Create: `backend/README.md`

- [ ] **Step 1: Create `backend/src/server.ts`**

```ts
import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 8000);

const app = await buildApp();
app
  .listen({ port, host: '0.0.0.0' })
  .then(() => console.log(`Recipe Admin API on http://localhost:${port} (docs at /docs)`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

- [ ] **Step 2: Create `backend/README.md`**

````markdown
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
- Edit schema in `src/db/schema.ts` → `npm run db:generate` → `npm run db:migrate`.
- Export DB back to the public site: `npm run export` (writes `../public/recipes.json`).
- Tests: `npm test` (uses the `recipes_test` database).

## Layout
- `src/db` — Drizzle schema (source of truth), client, migrate runner
- `src/schemas` — Zod API contract (drives validation + OpenAPI)
- `src/services` — transactional CRUD + nested assembly
- `src/routes` — Fastify routes
- `src/seed`, `src/export` — CLI scripts
````

- [ ] **Step 3: Start the server and smoke-test it**

Run: `cd backend && (npm run dev &) && sleep 3 && curl -s localhost:8000/health && curl -s localhost:8000/recipes | head -c 100 && kill %1`
Expected: `{"status":"ok"}` then the start of a JSON array of the 10 seeded recipes.

- [ ] **Step 4: Round-trip export and confirm it matches the public site shape**

Run: `cd backend && npm run export && cd .. && npx vitest run` (root tests still pass against the regenerated `public/recipes.json`)
Expected: export prints `Exported 10 recipes`, and the public site's existing tests pass unchanged.

- [ ] **Step 5: Full backend verification**

Run: `cd backend && npm run typecheck && npm test`
Expected: typecheck clean; all Vitest suites pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/server.ts backend/README.md
git commit -m "feat(backend): add server entrypoint and README"
```

---

## Self-review notes

- **Spec coverage:** normalized schema (Task 1), Drizzle-as-source-of-truth + Zod contract (Tasks 1–2), CRUD API with transactions (Tasks 4–5), OpenAPI for the SPA (Task 5), export-validates-against-Zod (Task 7), seed from `recipes.json` (Task 6), no-auth + CORS open (Task 5 `@fastify/cors`), photo exactly-one-owner check (Task 1), tests for CRUD/constraint/export (Tasks 4–7). All spec sections map to a task.
- **Deviations, both intentional and flagged:** `double precision` instead of `numeric` for `amount`; `text` PK instead of native `uuid` for recipe `id` (to preserve seeded `"1"`–`"10"` ids). Both explained in the "Reference" section.
- **Type consistency:** service function names (`createRecipe`, `getRecipe`, `listRecipes`, `updateRecipe`, `deleteRecipe`) are identical across service, routes, seed, export, and their tests. Zod schema names (`recipeSchema`, `recipeInputSchema`, `recipesDataSchema`, `recipeParamsSchema`) are consistent across tasks.
