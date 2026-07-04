import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from '../helpers/db.js';
import { buildApp } from '../../src/app.js';
import type { RecipeInput } from '../../src/schemas/recipe.js';

const app = await buildApp();

const input: RecipeInput = {
  name: 'Fluffy Pancakes',
  servings: 4,
  prepTime: '10 minutes',
  cookTime: '30 minutes',
  category: 'Breakfast',
  description: 'Classic fluffy pancakes',
  ingredients: [{ item: 'flour', amount: 2, unit: 'cups' }],
  instructions: [{ instruction: 'Mix', type: 'mix' }],
};

describe('recipe routes', () => {
  beforeEach(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('POST then GET a recipe round-trips', async () => {
    const create = await app.inject({ method: 'POST', url: '/recipes', payload: input });
    expect(create.statusCode).toBe(201);
    const id = create.json().id as string;

    const get = await app.inject({ method: 'GET', url: `/recipes/${id}` });
    expect(get.statusCode).toBe(200);
    expect(get.json().name).toBe('Fluffy Pancakes');
  });

  it('GET /recipes/:id returns 404 for missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/recipes/nope' });
    expect(res.statusCode).toBe(404);
  });

  it('POST with an invalid body returns 400', async () => {
    const res = await app.inject({
      method: 'POST', url: '/recipes', payload: { ...input, servings: -1 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('DELETE removes a recipe', async () => {
    const create = await app.inject({ method: 'POST', url: '/recipes', payload: input });
    const id = create.json().id as string;
    const del = await app.inject({ method: 'DELETE', url: `/recipes/${id}` });
    expect(del.statusCode).toBe(204);
    const get = await app.inject({ method: 'GET', url: `/recipes/${id}` });
    expect(get.statusCode).toBe(404);
  });

  it('exposes an OpenAPI schema', async () => {
    const res = await app.inject({ method: 'GET', url: '/openapi.json' });
    expect(res.statusCode).toBe(200);
    expect(res.json().paths['/recipes']).toBeDefined();
  });
});
