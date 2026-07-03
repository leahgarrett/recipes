import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, text, integer, doublePrecision, timestamp, serial, check,
} from 'drizzle-orm/pg-core';

export const stepTypeEnum = pgEnum('step_type', [
  'prep', 'cook', 'bake', 'rest', 'serve', 'mix', 'other',
]);

export const recipes = pgTable('recipes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  servings: integer('servings').notNull(),
  prepTime: text('prep_time').notNull(),
  cookTime: text('cook_time').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  item: text('item').notNull(),
  amount: doublePrecision('amount').notNull(),
  unit: text('unit').notNull(),
  position: integer('position').notNull(),
});

export const steps = pgTable('steps', {
  id: serial('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  instruction: text('instruction').notNull(),
  type: stepTypeEnum('type').notNull(),
  position: integer('position').notNull(),
});

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  recipeId: text('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  stepId: integer('step_id').references(() => steps.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: text('alt').notNull(),
  caption: text('caption'),
  position: integer('position').notNull(),
}, (t) => [
  check(
    'photo_owner_check',
    sql`(${t.recipeId} IS NOT NULL AND ${t.stepId} IS NULL) OR (${t.recipeId} IS NULL AND ${t.stepId} IS NOT NULL)`,
  ),
]);
