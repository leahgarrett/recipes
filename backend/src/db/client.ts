import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://recipes:recipes@localhost:5432/recipes';

export const pool = new Pool({ connectionString });
pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
});
export const db = drizzle(pool, { schema });
export type DB = typeof db;
