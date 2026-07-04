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
