import { describe, it, expect } from 'vitest';
import recipesJson from '../../public/recipes.json';
import type { RecipesData } from '../types/Recipe';

// Guards the published data: every recipe needs a URL-safe slug, and no two may share one,
// or a shared link would open the wrong recipe.
const data = recipesJson as RecipesData;

describe('public/recipes.json', () => {
  it('gives every recipe a well-formed slug', () => {
    const bad = data.recipes.filter((r) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug ?? ''));
    expect(bad.map((r) => r.name)).toEqual([]);
  });

  it('has no duplicate slugs', () => {
    const slugs = data.recipes.map((r) => r.slug);
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(dupes).toEqual([]);
  });
});
