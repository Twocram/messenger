# AGENTS.md

## Overview

This repository is a Bun workspace for a real-time messenger application.

Top-level packages:

- `packages/backend`: Bun + Elysia API, PostgreSQL access via Drizzle ORM, cookie-based auth, WebSocket message delivery
- `packages/frontend`: Vue 3 + Vite app, Pinia + Pinia Colada for server state, ky for HTTP, native WebSocket client for live chat updates
- `packages/shared`: shared TypeScript contracts and event types

Root scripts:

- `bun run dev`: run all package dev scripts
- `bun run dev:backend`
- `bun run dev:frontend`
- `bun run build`
- `bun run typecheck`
- `bun run lint`
- `bun run docker:up`
- `bun run db:generate`
- `bun run db:push`

## Architecture

### Backend

Backend entrypoint:

- `packages/backend/src/index.ts`

Core stack:

- Bun runtime
- Elysia for HTTP + WebSocket routes
- PostgreSQL
- Drizzle ORM with SQL migrations in `packages/backend/drizzle`

Database bootstrap:

- `packages/backend/src/db/index.ts`
- applies pending migrations on startup
- exports the Drizzle client and `schema`

Schema:

- `packages/backend/src/db/schema.ts`

Current domain tables:

- `users`
- `auth_sessions`
- `chats`
- `chat_members`
- `messages`

### Backend module pattern

Each backend module follows this structure:

- `index.ts`: Elysia routes only
- `service.ts`: abstract class containing module logic
- `model.ts`: Elysia `t` schemas and exported static types

Current backend modules:

- `auth`
- `user`
- `chat`
- `message`

Important rule:

- keep route declarations in `index.ts`
- keep business logic in the module service class
- keep validation/response schemas in `model.ts`

### Auth model

Auth is cookie-based, not localStorage-based.

Details:

- access token cookie: `messenger_access_token`
- refresh token cookie: `messenger_refresh_token`
- cookies are `HttpOnly`
- auth endpoints live in `packages/backend/src/modules/auth`
- frontend auth status is checked by calling `/auth/me`

Do not reintroduce localStorage token persistence.

### Real-time messaging

Message persistence remains HTTP-first:

- `POST /chats/:chatId/messages`

Live delivery is layered on top through WebSockets:

- socket endpoint: `/chats/:chatId/messages/ws`
- backend broadcasts `message:new` and `message:edit`
- frontend merges socket events into Pinia Colada cache

### Frontend

Frontend entrypoint:

- `packages/frontend/src/main.ts`

Core stack:

- Vue 3
- Vue Router
- Pinia
- Pinia Colada
- ky
- vee-validate + zod

Routing:

- `packages/frontend/src/router/index.ts`
- route guards call `checkAuthSession()`
- auth pages are guest-only
- app pages require a valid session

Data-fetching layers:

- `packages/frontend/src/lib/api.ts`: shared ky client, credentials included, refresh-on-401 behavior
- `packages/frontend/src/api/*`: endpoint-specific API functions
- `packages/frontend/src/composables/*`: Pinia Colada queries/mutations and reactive data orchestration

Current frontend API modules:

- `api/auth.ts`
- `api/users.ts`
- `api/chats.ts`
- `api/messages.ts`

Current frontend composables:

- `useAuth.ts`
- `useChats.ts`
- `useMessages.ts`

Views:

- `HomeView.vue`
- `LoginView.vue`
- `RegisterView.vue`
- `ChatView.vue`

UI components live under:

- `packages/frontend/src/components`

## Conventions

### General

- Prefer Bun commands and Bun APIs where practical
- Use `rg` for search
- Keep changes aligned with the current project style instead of introducing parallel patterns

### Backend conventions

- New backend features should generally become a module under `packages/backend/src/modules/<name>`
- Preserve the required module structure: `index.ts`, `service.ts`, `model.ts`
- Route validation and response contracts should use `t` from Elysia
- Service classes are intentional in this project; Oxlint is configured to allow them
- If data model changes are required:
  - edit `packages/backend/src/db/schema.ts`
  - generate a migration
  - keep Drizzle migration output checked into source control

### Frontend conventions

- Use `api/*` for thin transport wrappers
- Use `composables/*` for query/mutation orchestration
- Prefer Pinia Colada for server state instead of manual fetch state
- Use `vee-validate` + `zod` for forms
- Keep auth/session behavior cookie-based

### WebSocket conventions

- Persist first, then broadcast
- Treat HTTP as source of truth for writes
- Use WebSocket to update cached UI state, not to bypass persistence

## Environment

Important env values currently used:

- Backend:
  - `PORT`
  - `DATABASE_URL`
  - `FRONTEND_URL`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `JWT_ACCESS_TTL_SECONDS`
  - `JWT_REFRESH_TTL_SECONDS`
- Frontend:
  - `VITE_API_URL`

For local development, frontend and backend origins must match cookie/CORS expectations.

## Agent workflow

When changing this repo:

1. Read the relevant package/module before editing.
2. Preserve the existing architecture:
   - backend module pattern
   - frontend API/composable split
   - cookie-based auth
3. If adding DB fields/tables, update Drizzle schema and migrations together.
4. Run targeted verification first, then broader checks if needed.


## Notes

- `CLAUDE.md` contains repo-specific preferences around Bun usage, but parts of it are older than the current frontend stack. Follow the actual codebase architecture first when there is a conflict.
- The README currently contains some stale auth documentation from the pre-cookie flow. Treat the source code as authoritative.
