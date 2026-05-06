import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { RecipeList } from './RecipeList';
import { Recipe } from '../types/Recipe';

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Test Recipe 1',
    servings: 4,
    prepTime: '10 min',
    cookTime: '20 min',
    category: 'Breakfast',
    description: 'A test recipe',
    ingredients: [],
    instructions: [
      { instruction: 'Test step', type: 'other' }
    ]
  },
  {
    id: '2',
    name: 'Test Recipe 2',
    servings: 2,
    prepTime: '15 min',
    cookTime: '30 min',
    category: 'Dinner',
    description: 'Another test recipe',
    ingredients: [],
    instructions: [
      { instruction: 'Test step', type: 'other' }
    ]
  }
];

function renderWithMantine(component: React.ReactElement) {
  return render(<MantineProvider>{component}</MantineProvider>);
}

describe('RecipeList', () => {
  it('should render all recipes', () => {
    const onSelectRecipe = vi.fn();
    renderWithMantine(
      <RecipeList recipes={mockRecipes} onSelectRecipe={onSelectRecipe} />
    );

    expect(screen.getByText('Test Recipe 1')).toBeInTheDocument();
    expect(screen.getByText('Test Recipe 2')).toBeInTheDocument();
  });

  it('should call onSelectRecipe when a recipe is clicked', async () => {
    const user = userEvent.setup();
    const onSelectRecipe = vi.fn();
    renderWithMantine(
      <RecipeList recipes={mockRecipes} onSelectRecipe={onSelectRecipe} />
    );

    const recipeCard = screen.getByText('Test Recipe 1').closest('[role="button"]');
    expect(recipeCard).toBeInTheDocument();

    if (recipeCard) {
      await user.click(recipeCard);
      expect(onSelectRecipe).toHaveBeenCalledWith(mockRecipes[0]);
    }
  });

  it('should filter recipes by search term', async () => {
    const user = userEvent.setup();
    const onSelectRecipe = vi.fn();
    renderWithMantine(
      <RecipeList recipes={mockRecipes} onSelectRecipe={onSelectRecipe} />
    );

    const searchInput = screen.getByLabelText(/search recipes/i);
    await user.type(searchInput, 'Test Recipe 1');

    expect(screen.getByText('Test Recipe 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Recipe 2')).not.toBeInTheDocument();
  });

  it('should have accessible search input', () => {
    const onSelectRecipe = vi.fn();
    renderWithMantine(
      <RecipeList recipes={mockRecipes} onSelectRecipe={onSelectRecipe} />
    );

    const searchInput = screen.getByLabelText(/search recipes/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder');
  });

  it('should show recipe count', () => {
    const onSelectRecipe = vi.fn();
    renderWithMantine(
      <RecipeList recipes={mockRecipes} onSelectRecipe={onSelectRecipe} />
    );

    expect(screen.getByText(/Showing 2 of 2 recipes/i)).toBeInTheDocument();
  });
});
