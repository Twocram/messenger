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
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
