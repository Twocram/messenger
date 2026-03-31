import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const port = Number(process.env.PORT ?? "3000");
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/messenger";

const db = new Bun.SQL(databaseUrl, {
  max: 10,
  idleTimeout: 30,
});

async function getDatabaseStatus() {
  const result = await db<
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

await getDatabaseStatus();

const app = new Elysia()
  .use(cors())
  .get("/", async () => {
    const database = await getDatabaseStatus();

    return {
      message: "messenger API",
      database: database.currentDatabase,
    };
  })
  .get("/health", async ({ set }) => {
    try {
      const database = await getDatabaseStatus();

      return {
        status: "ok",
        database: database.currentDatabase,
        checkedAt: database.now,
      };
    } catch (error) {
      set.status = 503;

      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown database error",
      };
    }
  })
  .listen(port);

console.log(`Backend running at http://localhost:${app.server?.port}`);

process.on("SIGINT", async () => {
  await db.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await db.end();
  process.exit(0);
});

export type App = typeof app;
