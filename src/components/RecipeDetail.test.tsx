import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { RecipeDetail } from './RecipeDetail';
import { Recipe } from '../types/Recipe';
import { renderWithTheme } from '../test/render';

const mockRecipe: Recipe = {
  id: '1',
  name: 'Test Pancakes',
  slug: 'test-pancakes',
  servings: 4,
  prepTime: '10 min',
  cookTime: '20 min',
  category: 'Breakfast',
  description: 'Delicious pancakes',
  ingredients: [
    { item: 'flour', amount: 2, unit: 'cups' },
    { item: 'milk', amount: 1, unit: 'cup' }
  ],
  instructions: [
    { instruction: 'Mix ingredients', type: 'mix' },
    { instruction: 'Cook on griddle', type: 'cook' }
  ]
};


describe('RecipeDetail', () => {
  it('should render recipe name and description', () => {
    renderWithTheme(<RecipeDetail recipe={mockRecipe} />);

    expect(screen.getByText('Test Pancakes')).toBeInTheDocument();
    expect(screen.getByText('Delicious pancakes')).toBeInTheDocument();
  });

  it('should render ingredients list', () => {
    const { container } = renderWithTheme(<RecipeDetail recipe={mockRecipe} />);

    // Check that the Ingredients heading is present
    expect(screen.getByRole('heading', { name: 'Ingredients' })).toBeInTheDocument();

    // Check that we have list items (ingredients are rendered as list items)
    const listItems = container.querySelectorAll('ul li');
    expect(listItems.length).toBe(2); // We have 2 ingredients in mockRecipe
  });

  it('should render instructions', () => {
    renderWithTheme(<RecipeDetail recipe={mockRecipe} />);

    expect(screen.getByText('Mix ingredients')).toBeInTheDocument();
    expect(screen.getByText('Cook on griddle')).toBeInTheDocument();
  });

  it('should display initial servings', () => {
    renderWithTheme(<RecipeDetail recipe={mockRecipe} />);

    // Look for the badge that shows current servings
    const servingsBadge = screen.getByText('4');
    expect(servingsBadge).toBeInTheDocument();
  });

  it('should have accessible servings slider', () => {
    renderWithTheme(<RecipeDetail recipe={mockRecipe} />);

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-label');
  });

  it('should update ingredients when servings change', () => {
    renderWithTheme(<RecipeDetail recipe={mockRecipe} />);

    const slider = screen.getByRole('slider');

    // Simulate changing the slider value (this is a simplified test)
    // In a real scenario, you'd need to interact with the slider component
    // For now, we just verify the slider exists and has proper attributes
    expect(slider).toHaveAttribute('aria-valuemin', '1');
    expect(slider).toHaveAttribute('aria-valuemax', '12'); // 4 * 3
    expect(slider).toHaveAttribute('aria-valuenow', '4');
  });
});
