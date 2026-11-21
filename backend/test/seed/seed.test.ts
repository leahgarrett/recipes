import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from '../helpers/db.js';
import { seedFromData } from '../../src/seed/seed.js';
import { listRecipes } from '../../src/services/recipes.js';

const data = {
  recipes: [
    {
      id: '1', name: 'Pancakes', slug: 'nanas-pancakes', servings: 4, prepTime: '10 minutes',
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
    expect(all[0].slug).toBe('nanas-pancakes');
  });
});
