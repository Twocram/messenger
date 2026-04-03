import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { count } from "drizzle-orm";

import {
  closeDatabaseConnection,
  db,
  getDatabaseStatus,
  runMigrations,
  schema,
} from "./db";
import { authModule } from "./modules/auth";
import { chatModule } from "./modules/chat";
import { messageModule } from "./modules/message";
import { userModule } from "./modules/user";

const port = Number(process.env.PORT ?? "3000");
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
const apiVersion = process.env.API_VERSION ?? "v1";
const apiPrefix = `/api/${apiVersion}`;

await runMigrations();
await getDatabaseStatus();

const app = new Elysia()
  .use(
    cors({
      origin: frontendUrl,
      credentials: true,
    }),
  )
  .group(apiPrefix, (versionedApp) =>
    versionedApp
      .use(authModule)
      .use(userModule)
      .use(chatModule)
      .use(messageModule)
      .get("/", async () => {
        const database = await getDatabaseStatus();

        return {
          message: "messenger API",
          version: apiVersion,
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
            version: apiVersion,
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
      }),
  )
  .listen(port);

console.log(`Backend running at http://localhost:${app.server?.port}${apiPrefix}`);

process.on("SIGINT", async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

export type App = typeof app;
