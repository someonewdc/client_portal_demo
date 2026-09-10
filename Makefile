.PHONY: bootstrap doctor up down dev verify e2e

COMPOSE ?= docker compose
COMPOSE_FILE ?= compose.yaml
COMPOSE_PROJECT ?= client-portal-demo

compose = $(COMPOSE) -p $(COMPOSE_PROJECT) -f $(COMPOSE_FILE)

bootstrap:
	corepack enable
	corepack prepare pnpm@11.21.0 --activate
	pnpm install
	pnpm build:core

doctor:
	@node --version
	@pnpm --version
	@test -f pnpm-lock.yaml

# Full stand: web :3000, api :3001, Postgres host 5433 (D-016). Seed before api/web.
up:
	$(compose) up -d --wait postgres
	pnpm db:generate
	pnpm db:migrate
	pnpm db:seed
	$(compose) up -d --wait --build

down:
	$(compose) down

# db + api + @client-portal/web on :3000 (root `pnpm dev`).
# Stop compose api/web first so host processes can bind :3000/:3001 after make up.
dev:
	$(compose) stop api web
	$(compose) up -d --wait postgres
	pnpm db:generate
	pnpm db:migrate
	pnpm db:seed
	pnpm dev

verify: up
	pnpm db:generate
	pnpm db:migrate
	pnpm generate:api
	git diff --exit-code -- packages/api-client/openapi.json packages/api-client/src/schema.d.ts
	pnpm check:boundaries
	pnpm lint
	pnpm typecheck
	pnpm test
	pnpm test:packages
	pnpm build
	node scripts/compose-smoke.mjs
	pnpm test:e2e

# Index + cabinet e2e on :3000 against make dev + seed (D-021) or make up (F8).
# Playwright reuses Nuxt when that stand already holds the port; a Nuxt-only
# webServer is not enough for the demo-links and request-cabinet specs.
e2e:
	pnpm test:e2e
