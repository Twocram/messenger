import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { count } from "drizzle-orm";

import { closeDatabaseConnection, db, getDatabaseStatus, schema } from "./db";
import { authModule } from "./modules/auth";

const port = Number(process.env.PORT ?? "3000");

await getDatabaseStatus();

const app = new Elysia()
  .use(cors())
  .use(authModule)
  .get("/", async () => {
    const database = await getDatabaseStatus();

    return {
      message: "messenger API",
      database: database.currentDatabase,
    };
  })
  .get("/users", async () => {
    const result = await db.select({ value: count() }).from(schema.users);
    const totalUsers = result[0]?.value ?? 0;

    return {
      totalUsers,
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
  await closeDatabaseConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

export type App = typeof app;
