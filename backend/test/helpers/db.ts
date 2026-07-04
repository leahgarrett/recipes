import { db } from '../../src/db/client.js';
import { sql } from 'drizzle-orm';

export async function resetDb() {
  await db.execute(
    sql`TRUNCATE TABLE photos, steps, ingredients, recipes RESTART IDENTITY CASCADE`,
  );
}
