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
