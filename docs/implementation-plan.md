# План реализации

Каждая фича — отдельный чат, feature-ветка, один PR в `main`. Промпт:
`docs/llm/feature-NN.md`. TDD: тесты до кода (`AGENTS.md`, `docs/testing.md`).
Без `через implement → review` агент пишет сам. Цикл — только по явной
просьбе, skill `implement-review-cycle`.

## Что уже есть в заготовке

- pnpm workspace, Node 24.18.0, pnpm 11.21.0
- packages: `tsconfig`, `eslint-config`, `platform-core`, `nestjs-core`,
  `openapi-client-core`
- `apps/api`: health live/ready; `GET /demo/links`; `GET /requests/{accessSecret}`;
  `API_PORT=3001`, `WEB_ORIGIN=http://localhost:3000`, `DATABASE_URL`
- `apps/web`: Nuxt 4.5.2, Tailwind v4 `@theme`, IBM Plex, layout; индекс `/` из
  `GET /demo/links` (`createApiClient`, `useAsyncData`); кабинет `/r/{secret}` и тупик 404;
  HTML-лист файла `/r/{secret}/d/{fileName}` (D-029); `NUXT_PUBLIC_API_BASE_URL` с `/api/v1`.
  IA статусного документа (D-027) — фичи 9–12; клик по файлу — фича 13.
  Нарезка дефектов (D-030) — фича 14 docs; задачи 1–13 = фичи 15–27.
  UX/UI понятности (D-036, D-042, D-047) — `docs/ux/` (`выполни ux задачу N` /
  `реализуй ux задачу N`), не feature-NN.
- Root scripts (копировать буквально): `build:core`, `dev` (api+web), `db:generate`,
  `db:migrate`, `db:seed`, `generate:api`, `build`, `lint`, `check:boundaries`, `typecheck`,
  `test`, `test:e2e`, `test:packages`, `format`, `format:check`
- Makefile: `bootstrap`, `doctor`, `up` (web+api+postgres :3000/:3001/host :5433), `down`,
  `free-ports`, `restart` (`down` + `dev`, D-028), `dev` (только Postgres из compose +
  api/web на хосте; leftover `node` на `:3000`/`:3001` освобождает до `pnpm dev`), `e2e`
  (`playwright install --with-deps chromium` + `pnpm test:e2e`), `verify` (`up` + migrate +
  `generate:api` + diff generated client + корневые gates + compose-smoke + Chromium + e2e,
  D-018)
- CI: job `verify` — Postgres service + `DATABASE_URL` на 5432, generate/migrate,
  `generate:api`, `git diff --exit-code` на `openapi.json` / `schema.d.ts`, корневые gates;
  job `e2e` — `make up` (хост 5433) + `pnpm test:e2e`
- generated `packages/api-client` (`openapi.json` / `schema.d.ts` руками не править)
- ESLint игнорирует `apps/api/src/generated/prisma/**` и
  `packages/api-client/src/schema.d.ts`
- `generateOpaqueToken` / `hashOpaqueToken`

## Чего ещё нет (фича должна завести; AC проверяет имя script)

Предметный HTTP/MVP закрыт фичей 8. IA статусного документа — фичи 9–12 (D-027).
HTML-лист файла — фича 13 (D-029). Нарезка дефектов — фича 14 (D-030); имена задач
1–13 = фичи 15–27. UX/UI понятности — `docs/ux/task-NN.md`, не выдумывай feature-28.
Если нужен новый script — заведи его в той фиче или UX-задаче, чей AC это требует,
и запиши в `package.json`.

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
     → 13 кабинет: HTML-лист файла по клику на имя (unit+e2e red, затем страницы)
     → 14 docs нарезки дефектов (D-030…D-035, промпты 15–27)
     → 15 decode route param один раз
     → 16 reactive useRequestPortal (без NuxtLink)
     → 17 HTTP-статус HTML при ошибке API
     → 18 demo/links fail-closed на неполный каталог
     → 19 unique (requestId, fileName)
     → 20 заголовки Nuxt capability
     → 21 Cache-Control capability JSON
     → 22 CORS read-only + localhost/127.0.0.1
     → 23 timeout OpenAPI-клиента
     → 24 throttle GET /requests/{secret}
     → 25 NuxtLink (только после 16)
     → 26 Dockerfile USER node
     → 27 compose bind 127.0.0.1
```

Фичи 1–13 уже в поставке. Нарезка 9–12 — D-027. Фича 13 — D-029. Фича 14 — D-030:
оператор пишет `выполни задачу N` → [`docs/remediation-plan.md`](remediation-plan.md)
(карта 1→15 … 13→27). NuxtLink — только фича 25 и только после фичи 16 в `main`
(D-034); фича 16 `<a href>` не меняет.

Зависимость: фича N в `main` до старта N+1.

## UX/UI понятности (не фичи 15–27)

Отдельный трек: [`docs/ux/README.md`](ux/README.md), промпты `docs/ux/task-01.md` …
`task-20.md`. Операторы: `выполни ux задачу N` (1–12, один чат);
`реализуй ux задачу N` (13–20, сразу implement → review, D-042 / D-047). Не занимает
номера `feature-NN`. Фраза `выполни задачу N` / `реализуй задачу N` без `ux` —
только remediation (D-030). Не блокирует F15–27 и ими не блокируется (rebase
при пересечении Vue). Контракт — D-036…D-048. Код UX не писать в docs-PR
нарезки.

## Что не входит ни в одну фичу

Коннекторы amo/1С, чат, OTP, upload файлов, редактирование статусов, каталог, mock-api,
админка менеджера, Kubernetes, Redis.
