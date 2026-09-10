.PHONY: bootstrap doctor up down free-ports dev restart verify e2e

COMPOSE ?= docker compose
COMPOSE_FILE ?= compose.yaml
COMPOSE_PROJECT ?= client-portal-demo
APP_PORTS ?= 3000 3001
STAND_PORTS ?= 3000 3001 5433

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

# Compose down, then leftover host node on D-006 ports (D-028).
# Docker helpers on :5433 are skipped; compose owns that bind.
down:
	$(compose) down
	node scripts/free-stand-ports.mjs $(STAND_PORTS)

free-ports:
	node scripts/free-stand-ports.mjs $(STAND_PORTS)

# db + api + @client-portal/web on :3000 (root `pnpm dev`).
# Stop compose api/web first so host processes can bind :3000/:3001 after make up.
# Reclaim leftover nest/nuxt (node) on APP_PORTS; do not free 5433 (postgres stays).
dev:
	$(compose) stop api web
	node scripts/free-stand-ports.mjs $(APP_PORTS)
	$(compose) up -d --wait postgres
	pnpm db:generate
	pnpm db:migrate
	pnpm db:seed
	pnpm dev

# Tear down compose + leftover host node, then make dev (D-028).
restart: down
	$(MAKE) dev

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
	pnpm exec playwright install --with-deps chromium
	pnpm test:e2e

# Index + cabinet e2e on :3000 against make dev + seed (D-021) or make up (F8).
# Playwright reuses Nuxt when that stand already holds the port; a Nuxt-only
# webServer is not enough for the demo-links and request-cabinet specs.
e2e:
	pnpm exec playwright install --with-deps chromium
	pnpm test:e2e
