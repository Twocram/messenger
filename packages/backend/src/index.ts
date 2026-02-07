import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .get("/", () => ({ message: "Messsenger API" }))
  .get("/health", () => ({ status: "ok" }))
  .listen(3000);

console.log(`Backend running at http://localhost:${app.server?.port}`);

export type App = typeof app;
