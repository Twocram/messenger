# messenger

To install dependencies:

```bash
bun install
```

To run the workspace locally:

```bash
bun run dev
```

Backend API: `http://localhost:3000`

## Docker with PostgreSQL

This repository now includes a Docker Compose setup with:

- `backend`: the Bun + Elysia API
- `postgres`: a PostgreSQL database with a persistent Docker volume

Start everything with:

```bash
bun run docker:up
```

Stop it with:

```bash
bun run docker:down
```

The backend uses the following default connection string inside Docker:

```bash
postgresql://postgres:postgres@postgres:5432/messenger
```

Useful endpoints:

```bash
http://localhost:3000/
http://localhost:3000/health
http://localhost:3000/users
http://localhost:3000/auth/register
http://localhost:3000/auth/login
http://localhost:3000/auth/refresh
http://localhost:3000/auth/logout
http://localhost:3000/auth/me
```

## Auth Module

The backend now includes an auth module with:

- access JWTs for authenticated API requests
- refresh JWTs for session renewal
- persisted refresh sessions in PostgreSQL for rotation and logout

Auth flow:

```bash
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/me
```

`/auth/me` expects `Authorization: Bearer <accessToken>`.

`/auth/refresh` and `/auth/logout` expect a request body shaped like:

```json
{
  "refreshToken": "..."
}
```

Optional environment variables:

```bash
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=604800
```

## Drizzle ORM

The backend uses Drizzle ORM with the schema in `packages/backend/src/db/schema.ts`.

Generate migrations:

```bash
bun run db:generate
```

Push schema changes to the database:

```bash
bun run db:push
```

Open Drizzle Studio:

```bash
bun run db:studio
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
