FROM oven/bun:1.3.5 AS base

WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "packages/backend/src/index.ts"]
