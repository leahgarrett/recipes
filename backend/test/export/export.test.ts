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
