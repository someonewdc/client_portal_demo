# syntax=docker/dockerfile:1

FROM node:24.18.0-bookworm-slim AS base
WORKDIR /workspace
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@11.21.0 --activate

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
ENV DATABASE_URL=postgresql://client_portal:client_portal@postgres:5432/client_portal
RUN pnpm build:core \
  && pnpm --filter @client-portal/api db:generate \
  && pnpm --filter @client-portal/api build \
  && pnpm --filter @client-portal/web build

FROM build AS api-pack
RUN pnpm --filter @client-portal/api deploy --prod /out/api

FROM node:24.18.0-bookworm-slim AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM runtime AS api
ENV NODE_ENV=production
WORKDIR /app
COPY --from=api-pack /out/api ./
EXPOSE 3001
CMD ["node", "dist/main.js"]

FROM runtime AS web
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /workspace/apps/web/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
