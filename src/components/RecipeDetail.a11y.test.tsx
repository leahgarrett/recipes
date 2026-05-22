import { describe, it } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expectNoA11yViolations, expectNoA11yViolationsInContainer } from '../test/a11y';
import { renderWithTheme } from '../test/render';
import { RecipeDetail } from './RecipeDetail';
import type { Recipe } from '../types/Recipe';

const recipeWithPhotos: Recipe = {
  id: '1',
  name: 'Brown Butter Pancakes',
  servings: 4,
  prepTime: '10 min',
  cookTime: '15 min',
  category: 'Breakfast',
  description: 'Toasted, nutty.',
  photos: [
    { url: 'https://example.com/p1.jpg', alt: 'Stack of pancakes', caption: 'Fresh off the griddle' },
    { url: 'https://example.com/p2.jpg', alt: 'Browning butter in a pan' },
  ],
  ingredients: [
    { item: 'flour', amount: 1, unit: 'cup' },
    { item: 'brown butter', amount: 2, unit: 'tbsp' },
    { item: 'egg', amount: 1, unit: '' },
  ],
  instructions: [
    {
      instruction: 'Brown the butter until fragrant.',
      type: 'prep',
      photos: [{ url: 'https://example.com/s1.jpg', alt: 'Butter foaming in a saucepan' }],
    },
    { instruction: 'Whisk dry ingredients.', type: 'mix' },
    { instruction: 'Cook on a non-stick skillet.', type: 'cook' },
  ],
};

const recipeWithoutPhotos: Recipe = {
  ...recipeWithPhotos,
  photos: undefined,
  instructions: recipeWithPhotos.instructions.map(s => ({ ...s, photos: undefined })),
};

describe('RecipeDetail a11y', () => {
  it('recipe with photos is accessible', async () => {
    await expectNoA11yViolations(<RecipeDetail recipe={recipeWithPhotos} />);
  });

  it('recipe without photos is accessible', async () => {
    await expectNoA11yViolations(<RecipeDetail recipe={recipeWithoutPhotos} />);
  });

  it('after servings adjustment is still accessible', async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<RecipeDetail recipe={recipeWithPhotos} />);

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');

    await expectNoA11yViolationsInContainer(container);
  });
});
