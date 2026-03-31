import { drizzle } from "drizzle-orm/bun-sql";

import * as schema from "./schema";

export const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/messenger";

export const sql = new Bun.SQL(databaseUrl, {
  max: 10,
  idleTimeout: 30,
});

export const db = drizzle(sql, { schema });

export async function getDatabaseStatus() {
  const result = await sql<
    {
      currentDatabase: string;
      now: string;
    }[]
  >`select current_database() as "currentDatabase", now()::text as "now"`;

  const [row] = result;

  if (!row) {
    throw new Error("Database health check returned no rows");
  }

  return row;
}

export async function closeDatabaseConnection() {
  await sql.end();
}

export { schema };
