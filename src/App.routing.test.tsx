import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const recipe = (id: string, name: string, slug: string) => ({
  id, name, slug,
  servings: 4, prepTime: '10 min', cookTime: '15 min', category: 'Breakfast',
  description: `${name} description`,
  ingredients: [{ item: 'flour', amount: 1, unit: 'cup' }],
  instructions: [{ instruction: 'Mix.', type: 'mix' }],
});

const payload = {
  recipes: [
    recipe('1', 'Fluffy Pancakes', 'fluffy-pancakes'),
    { ...recipe('2', 'Banana Bread', 'banana-bread'), servings: 8 },
  ],
};

const detailHeading = (name: string) => screen.findByRole('heading', { level: 1, name });

function setHash(hash: string) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('App recipe links', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('shows the first recipe when the address has no recipe', async () => {
    render(<App />);
    expect(await detailHeading('Fluffy Pancakes')).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  it('opens the recipe named in the address', async () => {
    window.history.replaceState(null, '', '/#/banana-bread');
    render(<App />);
    expect(await detailHeading('Banana Bread')).toBeInTheDocument();
  });

  it('puts the chosen recipe in the address', async () => {
    const user = userEvent.setup();
    render(<App />);
    await detailHeading('Fluffy Pancakes');
    await user.click(screen.getByRole('button', { name: /banana bread/i }));
    expect(window.location.hash).toBe('#/banana-bread');
    expect(await detailHeading('Banana Bread')).toBeInTheDocument();
  });

  it('follows the address when it changes, e.g. pressing Back', async () => {
    window.history.replaceState(null, '', '/#/banana-bread');
    render(<App />);
    await detailHeading('Banana Bread');
    setHash('#/fluffy-pancakes');
    expect(await detailHeading('Fluffy Pancakes')).toBeInTheDocument();
  });

  it('names the recipe in the page title', async () => {
    window.history.replaceState(null, '', '/#/banana-bread');
    render(<App />);
    await detailHeading('Banana Bread');
    await waitFor(() => expect(document.title).toBe('Banana Bread · Recipes'));
  });

  it('explains when a link points to a recipe that does not exist', async () => {
    window.history.replaceState(null, '', '/#/no-such-recipe');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: /recipe not found/i }))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: /first recipe/i })).toHaveAttribute('href', '#/');
    await waitFor(() => expect(document.title).toBe('Recipe not found · Recipes'));
  });

  it('starts each recipe at its own servings, not the last one adjusted', async () => {
    const user = userEvent.setup();
    render(<App />);
    await detailHeading('Fluffy Pancakes');
    screen.getByRole('slider').focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '5');

    await user.click(screen.getByRole('button', { name: /banana bread/i }));
    await detailHeading('Banana Bread');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '8');
  });
});
