import { describe, it, expect } from 'vitest';
import { scaleIngredients, formatAmount } from './recipeScaling';
import { Ingredient } from '../types/Recipe';

describe('scaleIngredients', () => {
  it('should scale ingredients up correctly', () => {
    const ingredients: Ingredient[] = [
      { item: 'flour', amount: 2, unit: 'cups' },
      { item: 'sugar', amount: 1, unit: 'cup' }
    ];

    const scaled = scaleIngredients(ingredients, 4, 8);

    expect(scaled[0].amount).toBe(4);
    expect(scaled[1].amount).toBe(2);
  });

  it('should scale ingredients down correctly', () => {
    const ingredients: Ingredient[] = [
      { item: 'flour', amount: 2, unit: 'cups' },
      { item: 'sugar', amount: 1, unit: 'cup' }
    ];

    const scaled = scaleIngredients(ingredients, 4, 2);

    expect(scaled[0].amount).toBe(1);
    expect(scaled[1].amount).toBe(0.5);
  });

  it('should handle fractional scaling', () => {
    const ingredients: Ingredient[] = [
      { item: 'flour', amount: 3, unit: 'cups' }
    ];

    const scaled = scaleIngredients(ingredients, 4, 6);

    expect(scaled[0].amount).toBe(4.5);
  });

  it('should not modify original ingredients', () => {
    const ingredients: Ingredient[] = [
      { item: 'flour', amount: 2, unit: 'cups' }
    ];

    scaleIngredients(ingredients, 4, 8);

    expect(ingredients[0].amount).toBe(2);
  });
});

describe('formatAmount', () => {
  it('should format whole numbers', () => {
    expect(formatAmount(1)).toBe('1');
    expect(formatAmount(5)).toBe('5');
  });

  it('should format common fractions', () => {
    expect(formatAmount(0.25)).toBe('¼');
    expect(formatAmount(0.5)).toBe('½');
    expect(formatAmount(0.75)).toBe('¾');
    expect(formatAmount(0.33)).toBe('⅓');
    expect(formatAmount(0.67)).toBe('⅔');
  });

  it('should format mixed numbers', () => {
    expect(formatAmount(1.5)).toBe('1 ½');
    expect(formatAmount(2.25)).toBe('2 ¼');
  });

  it('should format decimal amounts', () => {
    expect(formatAmount(1.37)).toBe('1.37');
    expect(formatAmount(0.42)).toBe('0.42');
  });
});
