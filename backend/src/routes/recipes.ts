import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  recipeSchema, recipeInputSchema, recipeParamsSchema,
} from '../schemas/recipe.js';
import {
  createRecipe, getRecipe, listRecipes, updateRecipe, deleteRecipe, SlugTakenError,
} from '../services/recipes.js';

const notFoundSchema = z.object({ message: z.string() });
const conflictSchema = z.object({ message: z.string() });

export async function registerRecipeRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get('/recipes', {
    schema: { response: { 200: z.array(recipeSchema) } },
  }, async () => listRecipes());

  r.get('/recipes/:id', {
    schema: {
      params: recipeParamsSchema,
      response: { 200: recipeSchema, 404: notFoundSchema },
    },
  }, async (req, reply) => {
    const recipe = await getRecipe(req.params.id);
    if (!recipe) return reply.code(404).send({ message: 'Recipe not found' });
    return recipe;
  });

  r.post('/recipes', {
    schema: { body: recipeInputSchema, response: { 201: recipeSchema, 409: conflictSchema } },
  }, async (req, reply) => {
    try {
      const created = await createRecipe(req.body);
      return reply.code(201).send(created);
    } catch (err) {
      if (err instanceof SlugTakenError) return reply.code(409).send({ message: err.message });
      throw err;
    }
  });

  r.put('/recipes/:id', {
    schema: {
      params: recipeParamsSchema,
      body: recipeInputSchema,
      response: { 200: recipeSchema, 404: notFoundSchema, 409: conflictSchema },
    },
  }, async (req, reply) => {
    try {
      const updated = await updateRecipe(req.params.id, req.body);
      if (!updated) return reply.code(404).send({ message: 'Recipe not found' });
      return updated;
    } catch (err) {
      if (err instanceof SlugTakenError) return reply.code(409).send({ message: err.message });
      throw err;
    }
  });

  r.delete('/recipes/:id', {
    schema: {
      params: recipeParamsSchema,
      response: { 204: z.null(), 404: notFoundSchema },
    },
  }, async (req, reply) => {
    const ok = await deleteRecipe(req.params.id);
    if (!ok) return reply.code(404).send({ message: 'Recipe not found' });
    return reply.code(204).send(null);
  });
}
