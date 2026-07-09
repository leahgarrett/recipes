import { z } from 'zod';

export const photoSchema = z.object({
  url: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

export const ingredientSchema = z.object({
  item: z.string(),
  amount: z.number(),
  unit: z.string(),
});

export const stepTypeSchema = z.enum([
  'prep', 'cook', 'bake', 'rest', 'serve', 'mix', 'other',
]);

export const stepSchema = z.object({
  instruction: z.string(),
  type: stepTypeSchema,
  photos: z.array(photoSchema).optional(),
});

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  servings: z.number().int().positive(),
  prepTime: z.string(),
  cookTime: z.string(),
  category: z.string(),
  description: z.string(),
  photos: z.array(photoSchema).optional(),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(stepSchema),
});

export const recipeInputSchema = recipeSchema.omit({ id: true });
export const recipesDataSchema = z.object({ recipes: z.array(recipeSchema) });

export const recipeParamsSchema = z.object({ id: z.string() });

export type Photo = z.infer<typeof photoSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
