import { Ingredient } from '../types/Recipe';

/**
 * Scales ingredient amounts based on serving ratio
 * @param ingredients - Original ingredients array
 * @param originalServings - Original number of servings
 * @param newServings - Desired number of servings
 * @returns Scaled ingredients array
 */
export function scaleIngredients(
  ingredients: Ingredient[],
  originalServings: number,
  newServings: number
): Ingredient[] {
  const ratio = newServings / originalServings;

  return ingredients.map(ingredient => ({
    ...ingredient,
    amount: ingredient.amount * ratio
  }));
}

/**
 * Formats ingredient amount for display
 * @param amount - Numeric amount
 * @returns Formatted string (converts decimals to fractions where appropriate)
 */
export function formatAmount(amount: number): string {
  // Handle whole numbers
  if (Number.isInteger(amount)) {
    return amount.toString();
  }

  // Handle common fractions
  const fractions: { [key: number]: string } = {
    0.25: '¼',
    0.33: '⅓',
    0.5: '½',
    0.67: '⅔',
    0.75: '¾'
  };

  const whole = Math.floor(amount);
  const decimal = amount - whole;

  // Check if decimal matches a common fraction
  for (const [dec, frac] of Object.entries(fractions)) {
    if (Math.abs(decimal - parseFloat(dec)) < 0.01) {
      return whole > 0 ? `${whole} ${frac}` : frac;
    }
  }

  // Round to 2 decimal places for other amounts
  return amount.toFixed(2);
}
