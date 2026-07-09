import { writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/client.js';
import { listRecipes } from '../services/recipes.js';
import { recipesDataSchema } from '../schemas/recipe.js';

export async function exportToFile(outPath: string): Promise<number> {
  const recipes = await listRecipes();
  // Validate real data against the contract before writing — fails loudly on drift.
  const data = recipesDataSchema.parse({ recipes });
  // Write atomically (temp file + rename) so a mid-write failure can't corrupt
  // the public site's recipes.json.
  const tmpPath = `${outPath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  await rename(tmpPath, outPath);
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
