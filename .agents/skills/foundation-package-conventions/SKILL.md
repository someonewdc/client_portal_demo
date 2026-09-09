---
name: foundation-package-conventions
description: >-
  Connects and evolves reusable workspace packages (platform-core, nestjs-core,
  openapi-client-core, mock-core, tsconfig, eslint-config): declared subpath
  exports only, composition-root product defaults, and extraction guardrails.
  Use when importing core packages, adding a subpath, copying packages into a
  new workspace, or when tempted to put domain names, Prisma, or generated
  clients into shared packages.
---

# Foundation package conventions

Ядро — runtime libraries. Этот skill — как агент их **трогает**. Не копируй `src/` пакета
в приложение и не пересказывай README вместо импорта.

Scope пакетов в новом workspace: `@client-portal`.

## Non-negotiables

- Импорты только через declared subpath (`/correlation-id`, `/environment`, `/problem-details`,
  `/json`, `/http`, `/url`, `/input`, `/opaque-token`, `/permissions`, `/feature-flags`, …).
  Root barrel нет. `src/` и `dist/` в consumers запрещены.
- Product defaults живут в composition root приложения: CORS, uploads, rate limits, Swagger
  title, readiness probes, profile names, permission codes, cookie policy, Prisma DSN.
- `validateEnvironment` + app `extraSchema`. Не складывай имена профилей продукта в
  `platform-core`.
- `createProblemAwareClient<Paths>(baseUrlWithPrefix)`: `Paths` генерирует **этот** продукт.
  Не копируй чужой `packages/api-client` / `schema.d.ts`.
- `mock-core` — только mock/demo process, in-memory, ephemeral. Не PostgreSQL/Redis и не
  production API.
- Новый shared export — только после поиска существующего subpath и package-local tests.
- Второй независимый consumer обязателен, чтобы *извлекать* код в package. Два bounded
  context в одном API не считаются.

## Дерево: куда класть код

1. **App-local** — семантика одного продукта: DTO, Prisma models, seed, RBAC vocabulary,
   provider mapping, locale.
2. **Starter recipe** — способ сборки: workspace flags, CI, Makefile, `check-boundaries.mjs`.
3. **Reusable package** — стабильный контракт, tests, declared exports, без словаря продукта.
4. **Не извлекать** — похожие 10 строк, `BaseRepository`/`BaseUseCase`, universal retry,
   universal UI-kit, generated OpenAPI facade.

Access-control в `nestjs-core` сознательно не выносили: совпадает только `SetMetadata` /
`Reflector`. Не «обобщай» баг продукта в `platform-core`.

## Подключение

Порядок сборки: `platform-core` → `mock-core` (если есть) → `nestjs-core` →
`openapi-client-core`. Затем `pnpm build:core` до consumer typecheck/dev/e2e.

После смены public export: consumers, package README/`AGENTS.md`, `docs/shared-core.md`,
`pnpm check:boundaries`, `pnpm test:packages` (без project `api-client`).

## Do not

- Deep import `@client-portal/platform-core/src/...`.
- Дублировать Problem Details, correlation header или redaction «на всякий случай».
- Класть `mock-core` в production API.
- Публиковать packages до license/registry/semver.
