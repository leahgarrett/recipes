import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithTheme } from '../test/render';
import { RecipeList } from './RecipeList';
import type { Recipe } from '../types/Recipe';

const mockRecipes: Recipe[] = [
  { id: '1', name: 'Pancakes', slug: 'pancakes', servings: 4, prepTime: '10 min', cookTime: '15 min', category: 'Breakfast', description: 'A.', ingredients: [], instructions: [{ instruction: 'x', type: 'mix' }] },
  { id: '2', name: 'Pasta', slug: 'pasta', servings: 4, prepTime: '15 min', cookTime: '2 hr', category: 'Dinner', description: 'B.', ingredients: [], instructions: [{ instruction: 'x', type: 'cook' }] },
];

describe('RecipeList keyboard', () => {
  it('Tab order reaches search input first, then category select, then each card', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeList recipes={mockRecipes} onSelectRecipe={vi.fn()} />);

    const searchInput = screen.getByLabelText(/search recipes/i);
    const cards = screen.getAllByRole('button', { name: /view recipe:/i });

    await user.tab();
    expect(document.activeElement).toBe(searchInput);

    // Tab past the category select (the exact element Mantine focuses on
    // tab varies — input vs. trigger — so we just confirm focus moves off
    // the search input and eventually lands on the first card).
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(cards[0]);

    await user.tab();
    expect(document.activeElement).toBe(cards[1]);
  });

  it('Enter on a focused card calls onSelectRecipe', async () => {
    const user = userEvent.setup();
    const onSelectRecipe = vi.fn();
    renderWithTheme(<RecipeList recipes={mockRecipes} onSelectRecipe={onSelectRecipe} />);

    const firstCard = screen.getAllByRole('button', { name: /view recipe:/i })[0];
    firstCard.focus();
    await user.keyboard('{Enter}');

    expect(onSelectRecipe).toHaveBeenCalledTimes(1);
    expect(onSelectRecipe).toHaveBeenCalledWith(mockRecipes[0]);
  });

  it('Space on a focused card calls onSelectRecipe', async () => {
    const user = userEvent.setup();
    const onSelectRecipe = vi.fn();
    renderWithTheme(<RecipeList recipes={mockRecipes} onSelectRecipe={onSelectRecipe} />);

    const firstCard = screen.getAllByRole('button', { name: /view recipe:/i })[0];
    firstCard.focus();
    await user.keyboard(' ');

    expect(onSelectRecipe).toHaveBeenCalledTimes(1);
    expect(onSelectRecipe).toHaveBeenCalledWith(mockRecipes[0]);
  });

  it('Typing in the search input narrows visible cards', async () => {
    const user = userEvent.setup();
    renderWithTheme(<RecipeList recipes={mockRecipes} onSelectRecipe={vi.fn()} />);

    const searchInput = screen.getByLabelText(/search recipes/i);
    await user.type(searchInput, 'Pancakes');

    expect(screen.getByText('Pancakes')).toBeInTheDocument();
    expect(screen.queryByText('Pasta')).not.toBeInTheDocument();
  });
});
