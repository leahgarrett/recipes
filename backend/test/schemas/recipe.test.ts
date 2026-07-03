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
