# План реализации

Каждая фича — отдельный чат, feature-ветка, один PR в `main`. Промпт:
`docs/llm/feature-NN.md`. TDD: тесты до кода (`AGENTS.md`, `docs/testing.md`).

## Что уже есть в заготовке

- pnpm workspace, Node 24.18.0, pnpm 11.21.0
- packages: `tsconfig`, `eslint-config`, `platform-core`, `nestjs-core`,
  `openapi-client-core`
- `apps/api`: health live/ready; `GET /demo/links`; `GET /requests/{accessSecret}`;
  `API_PORT=3001`, `WEB_ORIGIN=http://localhost:3000`, `DATABASE_URL`
- `apps/web`: Nuxt 4.5.2, Tailwind v4 `@theme`, IBM Plex, layout; индекс `/` из
  `GET /demo/links` (`createApiClient`, `useAsyncData`); кабинет `/r/{secret}` и тупик 404;
  `NUXT_PUBLIC_API_BASE_URL` с `/api/v1`. IA статусного документа (D-027) — фичи 9–12.
- Root scripts (копировать буквально): `build:core`, `dev` (api+web), `db:generate`,
  `db:migrate`, `db:seed`, `generate:api`, `build`, `lint`, `check:boundaries`, `typecheck`,
  `test`, `test:e2e`, `test:packages`, `format`, `format:check`
- Makefile: `bootstrap`, `doctor`, `up` (web+api+postgres :3000/:3001/host :5433), `down`,
  `dev` (только Postgres из compose + api/web на хосте), `e2e` (`playwright install --with-deps
chromium` + `pnpm test:e2e`), `verify` (`up` + migrate + `generate:api` + diff generated
  client + корневые gates + compose-smoke + Chromium + e2e, D-018)
- CI: job `verify` — Postgres service + `DATABASE_URL` на 5432, generate/migrate,
  `generate:api`, `git diff --exit-code` на `openapi.json` / `schema.d.ts`, корневые gates;
  job `e2e` — `make up` (хост 5433) + `pnpm test:e2e`
- generated `packages/api-client` (`openapi.json` / `schema.d.ts` руками не править)
- ESLint игнорирует `apps/api/src/generated/prisma/**` и
  `packages/api-client/src/schema.d.ts`
- `generateOpaqueToken` / `hashOpaqueToken`

## Чего ещё нет (фича должна завести; AC проверяет имя script)

Предметный HTTP/MVP закрыт фичей 8. IA статусного документа — фичи 9–12 (D-027). Не
выдумывай другие имена. Если нужен новый script — заведи его в той фиче, чей AC это
требует, и запиши в `package.json`.

## Порядок

```text
docs → 1 Postgres/Prisma/ready
     → 2 заявка + OpenAPI + api-client
     → 3 Nuxt + make dev (web, без Tailwind)
     → 4 Tailwind + токены + layout
     → 5 Playwright harness
     → 6 индекс (e2e red, затем страница)
     → 7 кабинет + 404 (e2e red, затем страница)
     → 8 compose-smoke + CI e2e
     → 9 docs статусного документа (D-027)
     → 10 кабинет: рамка + лента процесса (e2e red, затем страница)
     → 11 кабинет: файлы-записи + колонка комментария (unit+e2e red, затем код)
     → 12 индекс: заголовок и жест клика (e2e red, затем страница)
```

Фичи 1–8 уже в поставке. Нарезка 9–12 — D-027: не смешивать процесс кабинета с файлами
и индексом; F10 и F11 оба правят один Vue — только последовательно.

Зависимость: фича N в `main` до старта N+1.

## Что не входит ни в одну фичу

Коннекторы amo/1С, чат, OTP, upload файлов, редактирование статусов, каталог, mock-api,
админка менеджера, Kubernetes, Redis.
