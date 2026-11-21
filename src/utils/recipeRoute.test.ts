import { describe, it, expect } from 'vitest';
import { recipeHref, slugFromHash } from './recipeRoute';

describe('slugFromHash', () => {
  it.each([
    ['#/fluffy-pancakes', 'fluffy-pancakes'],
    ['#/fluffy-pancakes/', 'fluffy-pancakes'],
    ['#fluffy-pancakes', 'fluffy-pancakes'],
    ['#/Fluffy-Pancakes', 'fluffy-pancakes'],
    ['#/cr%C3%A8me', 'crème'],
  ])('reads %j as %j', (hash, slug) => {
    expect(slugFromHash(hash)).toBe(slug);
  });

  it.each(['', '#', '#/'])('treats %j as no recipe', (hash) => {
    expect(slugFromHash(hash)).toBeNull();
  });

  it('does not throw on a malformed escape', () => {
    expect(slugFromHash('#/%E0%A4%A')).toBe('%e0%a4%a');
  });
});

describe('recipeHref', () => {
  it('builds a hash link', () => {
    expect(recipeHref('fluffy-pancakes')).toBe('#/fluffy-pancakes');
  });
});
