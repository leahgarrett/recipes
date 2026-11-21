import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from '../helpers/db.js';
import {
  createRecipe, getRecipe, listRecipes, updateRecipe, deleteRecipe, SlugTakenError,
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

  it('replaces recipe-level and step-level photos on update without duplicates', async () => {
    await createRecipe(input, '1');
    const updated = await updateRecipe('1', {
      ...input,
      photos: [{ url: 'https://example.com/new-recipe.png', alt: 'new recipe photo' }],
      instructions: [
        { instruction: 'New mix', type: 'mix' },
        {
          instruction: 'New cook',
          type: 'cook',
          photos: [{ url: 'https://example.com/new-step.png', alt: 'new cooking', caption: 'sizzle' }],
        },
      ],
    });
    expect(updated).not.toBeNull();
    expect(updated!.photos).toEqual([
      { url: 'https://example.com/new-recipe.png', alt: 'new recipe photo' },
    ]);
    expect(updated!.instructions[0].photos).toBeUndefined();
    expect(updated!.instructions[1].photos).toEqual([
      { url: 'https://example.com/new-step.png', alt: 'new cooking', caption: 'sizzle' },
    ]);
    // Re-fetch to confirm persistence, not just the returned value.
    const refetched = await getRecipe('1');
    expect(refetched!.photos).toEqual(updated!.photos);
    expect(refetched!.instructions[1].photos).toEqual(updated!.instructions[1].photos);
  });

  it('derives a slug from the name on create', async () => {
    const created = await createRecipe(input);
    expect(created.slug).toBe('fluffy-pancakes');
  });

  it('suffixes a derived slug that is already taken', async () => {
    await createRecipe(input, 'a');
    const second = await createRecipe(input, 'b');
    const third = await createRecipe(input, 'c');
    expect(second.slug).toBe('fluffy-pancakes-2');
    expect(third.slug).toBe('fluffy-pancakes-3');
  });

  it('keeps an explicit slug on create', async () => {
    const created = await createRecipe({ ...input, slug: 'nanas-pancakes' });
    expect(created.slug).toBe('nanas-pancakes');
  });

  it('rejects an explicit slug that is already taken', async () => {
    await createRecipe(input, 'a');
    await expect(createRecipe({ ...input, slug: 'fluffy-pancakes' }, 'b'))
      .rejects.toBeInstanceOf(SlugTakenError);
  });

  it('keeps the slug when a recipe is renamed', async () => {
    await createRecipe(input, '1');
    const updated = await updateRecipe('1', { ...input, name: "Nana's Pancakes" });
    expect(updated!.slug).toBe('fluffy-pancakes');
  });

  it('changes the slug on update only when one is given', async () => {
    await createRecipe(input, '1');
    const updated = await updateRecipe('1', { ...input, slug: 'nanas-pancakes' });
    expect(updated!.slug).toBe('nanas-pancakes');
  });

  it('rejects an update to a slug another recipe uses', async () => {
    await createRecipe(input, 'a');
    await createRecipe({ ...input, name: 'Waffles' }, 'b');
    await expect(updateRecipe('b', { ...input, slug: 'fluffy-pancakes' }))
      .rejects.toBeInstanceOf(SlugTakenError);
  });

  it('allows an update that resends the recipe\'s own slug', async () => {
    await createRecipe(input, '1');
    const updated = await updateRecipe('1', { ...input, slug: 'fluffy-pancakes' });
    expect(updated!.slug).toBe('fluffy-pancakes');
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
