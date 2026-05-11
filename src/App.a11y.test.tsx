import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { expectNoA11yViolations, expectNoA11yViolationsInContainer } from './test/a11y';
import App from './App';

const mockRecipesPayload = {
  recipes: [
    {
      id: '1',
      name: 'Brown Butter Pancakes',
      servings: 4,
      prepTime: '10 min',
      cookTime: '15 min',
      category: 'Breakfast',
      description: 'Toasted, nutty.',
      ingredients: [{ item: 'flour', amount: 1, unit: 'cup' }],
      instructions: [{ instruction: 'Mix.', type: 'mix' }],
    },
  ],
};

describe('App a11y', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loading state is accessible', async () => {
    // Pending fetch keeps the component in its loading branch.
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})));
    await expectNoA11yViolations(<App />);
  });

  it('error state is accessible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { container } = render(<App />);
    await waitFor(() => screen.getByRole('alert'));
    await expectNoA11yViolationsInContainer(container);
  });

  it('main app with recipes loaded is accessible', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRecipesPayload),
      })
    );
    const { container } = render(<App />);
    // The recipe name appears in both the list (h2) and detail panel (h1),
    // so getAllByText is used to confirm the loaded state without ambiguity.
    await waitFor(() => screen.getAllByText('Brown Butter Pancakes'));
    await expectNoA11yViolationsInContainer(container);
  });
});
