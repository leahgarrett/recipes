import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/utils/slug.js';

describe('slugify', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugify('Fluffy Pancakes')).toBe('fluffy-pancakes');
  });

  it('collapses punctuation and repeated separators', () => {
    expect(slugify("Nana's  Veggie-Packed Meatloaf!")).toBe('nanas-veggie-packed-meatloaf');
  });

  it('strips accents', () => {
    expect(slugify('Crème Brûlée')).toBe('creme-brulee');
  });

  it('turns & into "and"', () => {
    expect(slugify('Fish & Chips')).toBe('fish-and-chips');
  });

  it('falls back to "recipe" when nothing usable remains', () => {
    expect(slugify('!!!')).toBe('recipe');
  });
});
