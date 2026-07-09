import { db } from '../../src/db/client.js';
import { sql } from 'drizzle-orm';

export async function resetDb() {
  // Safety guard: refuse to truncate anything but a test database, independent of
  // how DATABASE_URL was configured. TRUNCATE is irreversible.
  const result = await db.execute<{ current_database: string }>(
    sql`SELECT current_database()`,
  );
  const dbName = result.rows[0]?.current_database;
  if (!dbName || !dbName.includes('test')) {
    throw new Error(
      `resetDb() refused to run: connected database "${dbName}" is not a test database`,
    );
  }
  await db.execute(
    sql`TRUNCATE TABLE photos, steps, ingredients, recipes RESTART IDENTITY CASCADE`,
  );
}
