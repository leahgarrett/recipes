import { describe, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../test/a11y';
import { RecipeList } from './RecipeList';
import type { Recipe } from '../types/Recipe';

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Brown Butter Pancakes',
    servings: 4,
    prepTime: '10 min',
    cookTime: '15 min',
    category: 'Breakfast',
    description: 'Toasted, nutty.',
    ingredients: [],
    instructions: [{ instruction: 'Step', type: 'mix' }],
  },
  {
    id: '2',
    name: 'Slow-Roasted Tomato Pasta',
    servings: 4,
    prepTime: '15 min',
    cookTime: '2 hr',
    category: 'Dinner',
    description: 'Six tomatoes, two hours.',
    ingredients: [],
    instructions: [{ instruction: 'Step', type: 'cook' }],
  },
  {
    id: '3',
    name: 'Walnut Olive Oil Cake',
    servings: 8,
    prepTime: '20 min',
    cookTime: '45 min',
    category: 'Dessert',
    description: 'Bittersweet, dense.',
    ingredients: [],
    instructions: [{ instruction: 'Step', type: 'bake' }],
  },
];

describe('RecipeList a11y', () => {
  it('default render with multiple recipes is accessible', async () => {
    await expectNoA11yViolations(
      <RecipeList recipes={mockRecipes} onSelectRecipe={vi.fn()} />
    );
  });

  it('with one card in selected state is accessible', async () => {
    await expectNoA11yViolations(
      <RecipeList recipes={mockRecipes} onSelectRecipe={vi.fn()} selectedRecipeId="1" />
    );
  });

  it('with single matching recipe (filtered narrow result) is accessible', async () => {
    await expectNoA11yViolations(
      <RecipeList recipes={[mockRecipes[0]]} onSelectRecipe={vi.fn()} />
    );
  });

  it('with empty recipes list (empty state) is accessible', async () => {
    await expectNoA11yViolations(
      <RecipeList recipes={[]} onSelectRecipe={vi.fn()} />
    );
  });
});
