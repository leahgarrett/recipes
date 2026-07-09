import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { recipes, ingredients, steps, photos } from '../db/schema.js';
import type { Photo, Recipe, RecipeInput } from '../schemas/recipe.js';

type PhotoRow = typeof photos.$inferSelect;

function mapPhoto(row: PhotoRow): Photo {
  const photo: Photo = { url: row.url, alt: row.alt };
  if (row.caption !== null) photo.caption = row.caption;
  return photo;
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const [row] = await db.select().from(recipes).where(eq(recipes.id, id));
  if (!row) return null;

  const ingRows = await db.select().from(ingredients)
    .where(eq(ingredients.recipeId, id)).orderBy(asc(ingredients.position));
  const stepRows = await db.select().from(steps)
    .where(eq(steps.recipeId, id)).orderBy(asc(steps.position));
  const recipePhotoRows = await db.select().from(photos)
    .where(eq(photos.recipeId, id)).orderBy(asc(photos.position));

  const instructions = await Promise.all(stepRows.map(async (s) => {
    const stepPhotoRows = await db.select().from(photos)
      .where(eq(photos.stepId, s.id)).orderBy(asc(photos.position));
    const step: Recipe['instructions'][number] = { instruction: s.instruction, type: s.type };
    if (stepPhotoRows.length) step.photos = stepPhotoRows.map(mapPhoto);
    return step;
  }));

  const recipe: Recipe = {
    id: row.id,
    name: row.name,
    servings: row.servings,
    prepTime: row.prepTime,
    cookTime: row.cookTime,
    category: row.category,
    description: row.description,
    ingredients: ingRows.map((i) => ({ item: i.item, amount: i.amount, unit: i.unit })),
    instructions,
  };
  if (recipePhotoRows.length) recipe.photos = recipePhotoRows.map(mapPhoto);
  return recipe;
}

export async function listRecipes(): Promise<Recipe[]> {
  const rows = await db.select({ id: recipes.id }).from(recipes)
    .orderBy(asc(recipes.createdAt), asc(recipes.id));
  const result: Recipe[] = [];
  for (const { id } of rows) {
    const recipe = await getRecipe(id);
    if (recipe) result.push(recipe);
  }
  return result;
}

async function insertChildren(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  id: string,
  input: RecipeInput,
) {
  if (input.ingredients.length) {
    await tx.insert(ingredients).values(
      input.ingredients.map((ing, idx) => ({
        recipeId: id, item: ing.item, amount: ing.amount, unit: ing.unit, position: idx,
      })),
    );
  }
  for (const [idx, step] of input.instructions.entries()) {
    const [insertedStep] = await tx.insert(steps).values({
      recipeId: id, instruction: step.instruction, type: step.type, position: idx,
    }).returning({ id: steps.id });
    if (step.photos?.length) {
      await tx.insert(photos).values(
        step.photos.map((p, pIdx) => ({
          stepId: insertedStep.id, url: p.url, alt: p.alt,
          caption: p.caption ?? null, position: pIdx,
        })),
      );
    }
  }
  if (input.photos?.length) {
    await tx.insert(photos).values(
      input.photos.map((p, idx) => ({
        recipeId: id, url: p.url, alt: p.alt, caption: p.caption ?? null, position: idx,
      })),
    );
  }
}

export async function createRecipe(input: RecipeInput, id: string = randomUUID()): Promise<Recipe> {
  await db.transaction(async (tx) => {
    await tx.insert(recipes).values({
      id, name: input.name, servings: input.servings, prepTime: input.prepTime,
      cookTime: input.cookTime, category: input.category, description: input.description,
    });
    await insertChildren(tx, id, input);
  });
  return (await getRecipe(id))!;
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<Recipe | null> {
  // Optimistic existence check: fine for this single-admin local tool. A concurrent delete
  // between this check and the transaction isn't a real scenario here; if it ever became one,
  // move the check inside the transaction.
  const [existing] = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.id, id));
  if (!existing) return null;

  await db.transaction(async (tx) => {
    await tx.update(recipes).set({
      name: input.name, servings: input.servings, prepTime: input.prepTime,
      cookTime: input.cookTime, category: input.category, description: input.description,
      updatedAt: new Date(),
    }).where(eq(recipes.id, id));
    // Children cascade-delete via the recipe FK only on recipe delete, so clear them explicitly.
    await tx.delete(photos).where(eq(photos.recipeId, id));
    await tx.delete(steps).where(eq(steps.recipeId, id)); // step photos cascade via step FK
    await tx.delete(ingredients).where(eq(ingredients.recipeId, id));
    await insertChildren(tx, id, input);
  });
  return getRecipe(id);
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const deleted = await db.delete(recipes).where(eq(recipes.id, id)).returning({ id: recipes.id });
  return deleted.length > 0;
}
