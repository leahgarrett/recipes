import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithTheme } from '../test/render';
import { RecipeDetail } from './RecipeDetail';
import type { Recipe } from '../types/Recipe';

const recipe: Recipe = {
  id: '1',
  name: 'Pancakes',
  slug: 'pancakes',
  servings: 4,
  prepTime: '10 min',
  cookTime: '15 min',
  category: 'Breakfast',
  description: 'A.',
  ingredients: [
    { item: 'flour', amount: 1, unit: 'cup' },
    { item: 'milk', amount: 1, unit: 'cup' },
  ],
  instructions: [
    { instruction: 'Mix the dry ingredients.', type: 'mix' },
    { instruction: 'Cook on the griddle.', type: 'cook' },
  ],
};

describe('RecipeDetail keyboard', () => {
  it('Tab eventually reaches the slider', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeDetail recipe={recipe} />);

    const slider = screen.getByRole('slider');

    // Tab repeatedly until focus reaches the slider, with a safety cap.
    for (let i = 0; i < 10; i++) {
      await user.tab();
      if (document.activeElement === slider) break;
    }
    expect(document.activeElement).toBe(slider);
  });

  it('Arrow Right on the focused slider increments servings', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeDetail recipe={recipe} />);

    const slider = screen.getByRole('slider');
    slider.focus();

    expect(slider).toHaveAttribute('aria-valuenow', '4');
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '5');
  });

  it('Arrow Left on the focused slider decrements servings', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeDetail recipe={recipe} />);

    const slider = screen.getByRole('slider');
    slider.focus();

    expect(slider).toHaveAttribute('aria-valuenow', '4');
    await user.keyboard('{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '3');
  });

  it('Slider value change updates rendered ingredient amounts', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeDetail recipe={recipe} />);

    // Original recipe: 4 servings, 1 cup flour. Doubling to 8 servings = 2 cups.
    const slider = screen.getByRole('slider');
    slider.focus();

    // Press ArrowRight 4 times to go from 4 → 8 servings.
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '8');

    // The "2" should now appear as an ingredient amount (2 cups flour, 2 cups milk).
    // Use getAllByRole('list')[0] because the component renders both ingredients (ul) and instructions (ol) lists.
    const ingredientsList = screen.getAllByRole('list')[0];
    const flourLine = within(ingredientsList).getByText(/flour/);
    expect(flourLine.textContent).toMatch(/2\s*cups?\s*flour/);
  });
});
