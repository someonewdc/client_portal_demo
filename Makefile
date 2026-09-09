.PHONY: bootstrap doctor up down dev verify

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

up:
	$(compose) up -d --wait

down:
	$(compose) down

# db + api + @client-portal/web on :3000 (root `pnpm dev`). `up` stays Postgres-only.
dev: up
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
