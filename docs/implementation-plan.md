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
  Нарезка live-показа (D-049) — фича 28 docs; код — фичи 29–33 (`выполни фичу N`).
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
1–13 = фичи 15–27. UX/UI понятности — `docs/ux/task-NN.md`, не номера live-фич.
Live-сценарий — фичи 28–33 (D-049…D-052): F28 docs-only; код F29–33 на `main`.
Вынос ядра (D-056) — не номер feature-NN: docs-нарезка шага 0; код генератора —
`docs/llm/scaffold-new-workspace.md`. Если нужен новый script — заведи его в той
фиче, UX-задаче или промпте выноса, чей AC это требует, и запиши в `package.json`.

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
     → 28 docs live-сценария (D-049…D-052, промпты 29–33)
     → 29 live fixture З-10046 + seed + GET /requests live
     → 30 conductor API GET/POST + CORS POST + env
     → 31 экран /start + ссылка с индекса
     → 32 экран /c/{secret} + ссылка с индекса
     → 33 poll кабинета живой заявки
```

Фичи 1–13 уже в поставке. Нарезка 9–12 — D-027. Фича 13 — D-029. Фича 14 — D-030:
оператор пишет `выполни задачу N` → [`docs/remediation-plan.md`](remediation-plan.md)
(карта 1→15 … 13→27). NuxtLink — только фича 25 и только после фичи 16 в `main`
(D-034); фича 16 `<a href>` не меняет. Фича 28 — D-049: оператор пишет
`выполни фичу N` → `docs/llm/feature-NN.md` (29–33). Это не `выполни задачу N`
и не UX-фразы.

Зависимость: фича N в `main` до старта N+1.

## UX/UI понятности (не фичи 15–27)

Отдельный трек: [`docs/ux/README.md`](ux/README.md), промпты `docs/ux/task-01.md` …
`task-20.md`. Операторы: `выполни ux задачу N` (1–12, один чат);
`реализуй ux задачу N` (13–20, сразу implement → review, D-042 / D-047). Не занимает
номера `feature-NN`. Фраза `выполни задачу N` / `реализуй задачу N` без `ux` —
только remediation (D-030). Не блокирует F15–27 и ими не блокируется (rebase
при пересечении Vue). Контракт — D-036…D-048. Код UX не писать в docs-PR
нарезки.

## Live-сценарий показа (не UX и не remediation)

Отдельный трек после F27: [`docs/llm/feature-28.md`](llm/feature-28.md) …
`feature-33.md`. Оператор: `выполни фичу N`. Контракт — D-049…D-052. Код F29–33
не писать в docs-PR нарезки (F28). Зависимость: фича N в `main` до старта N+1.

## Вынос ядра (не фичи 1–33 и не UX)

Отдельный трек, один PR в `main` после этой docs-нарезки. Оператор:
`реализуй вынос ядра` → [`docs/llm/scaffold-new-workspace.md`](llm/scaffold-new-workspace.md).
Контракт — D-056. Цикл implement→review не используется. Этот git остаётся
consumer №1 (`@client-portal`, порты D-006). Продукт Protostar — не этот
репозиторий. Не `выполни фичу N`.

Код генератора режут на этапы S1–S6: у каждого свой red, потом минимальный
green. Не склеивать S1–S6 в один assert «скрипт целиком».

```text
S1 каркас CLI          → parse argv, отказ на плохие флаги / --out внутри git
S2 rewrite токенов     → scope / name / brand / ports на фикстуре строк
S3 guards              → denylist путей + fail-closed token scan
S4 core preset         → дерево dest без kit C и без театра D
S5 portal + rewrite    → kit C есть; смешанные файлы как таблица ниже
S6 install / build     → pnpm install + build:core (+ generate:api) в tmpdir
```

Зависимость: S(n) green до кода S(n+1). Targeted: `node --test scripts/scaffold-new-workspace.spec.mjs`.

### Allowlist (префиксы `git ls-files`; минус denylist; потом rewrite)

**A — оба пресета, as-is + rewrite `@client-portal` → `--scope`:**
`packages/platform-core/`, `packages/nestjs-core/`, `packages/openapi-client-core/`,
`packages/tsconfig/`, `packages/eslint-config/` (весь tracked, включая tests и README).

**B — оба пресета (рецепт; часть строк — rewrite-таблица):**
`.nvmrc`, `.node-version`, `pnpm-workspace.yaml`, корневой `package.json`,
`prettier.config.mjs`, `.prettierignore`, `eslint.config.mjs`, `.gitignore`,
`.dockerignore`, `Makefile`, `compose.yaml`, `Dockerfile`, `.env.example`,
`.github/workflows/ci.yml`, `.github/actions/setup-workspace/action.yml`,
`scripts/check-boundaries.mjs`, `scripts/check-boundaries.spec.mjs`,
`scripts/test-packages.mjs`, `scripts/test-packages.spec.mjs`,
`scripts/free-stand-ports.mjs`, `scripts/free-stand-ports.spec.mjs`,
`scripts/compose-smoke.mjs`,
`apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`,
`apps/api/prisma.config.ts`,
`apps/api/src/main.ts`, `apps/api/src/app.module.ts`,
`apps/api/src/bootstrap/create-application.ts`,
`apps/api/src/core/config/api-env.ts`, `apps/api/src/core/config/api-env.spec.ts`,
`apps/api/src/core/config/cors-origins.ts`, `apps/api/src/core/config/cors-origins.spec.ts`,
`apps/api/src/health/` (все tracked),
`apps/api/src/persistence/` (все tracked),
`apps/api/src/openapi/document.ts`, `apps/api/src/openapi/export-openapi.ts`,
`apps/api/src/openapi/openapi.contract.spec.ts`,
`apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts`,
`apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/nuxt.config.ts`,
`apps/web/app/app.vue`, `apps/web/app/plugins/api.ts`,
`apps/web/app/layouts/default.vue`, `apps/web/app/assets/css/main.css`,
`apps/web/app/pages/index.vue`,
`packages/api-client/package.json`, `packages/api-client/tsconfig.json`,
`packages/api-client/src/index.ts`,
`.agents/skills/foundation-package-conventions/SKILL.md`,
`.agents/skills/nestjs-hexagonal-boundaries/SKILL.md`,
`.agents/skills/change-impact-gates/SKILL.md`,
`.agents/skills/prisma-persistence-boundary/SKILL.md`,
`.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`,
`.agents/skills/verification-honesty/SKILL.md`,
`.agents/skills/git-delivery/SKILL.md`,
`.agents/skills/docker-reclaim-space/SKILL.md`.

**C — только `portal`:**
`apps/api/src/requests/requests.module.ts`,
`apps/api/src/requests/public.ts`,
`apps/api/src/requests/http/request-portal.controller.ts`,
`apps/api/src/requests/http/request.dto.ts`,
`apps/api/src/requests/http/capability-cache-control.interceptor.ts`,
`apps/api/src/requests/http/portal-throttle.ts`,
`apps/api/src/requests/http/map-application-error.ts`,
`apps/api/src/requests/application/get-request-by-access-secret.use-case.ts`,
`apps/api/src/requests/application/get-request-by-access-secret.use-case.spec.ts`,
`apps/api/src/requests/application/request-not-found.error.ts`,
`apps/api/src/requests/application/request-query.port.ts`,
`apps/api/src/requests/domain/request.ts`,
`apps/api/src/requests/domain/request-status.ts`,
`apps/api/src/requests/domain/request-stages.ts`,
`apps/api/src/requests/domain/request-stages.spec.ts`,
`apps/api/src/requests/domain/request-file-spec-lines.spec.ts`,
`apps/api/src/requests/infrastructure/prisma-request.repository.ts`,
`apps/api/src/requests/infrastructure/prisma-request.mapper.ts`,
`apps/api/src/requests/infrastructure/apply-request-seed.ts`,
`apps/web/app/pages/r/[accessSecret]/index.vue`,
`apps/web/app/pages/r/[accessSecret]/d/[fileName].vue`,
`apps/web/app/composables/useRequestPortal.ts`,
`apps/web/app/utils/async-data-problem.ts`,
`apps/web/app/utils/request-file-display.ts`,
`apps/web/app/utils/request-next-step.ts`,
`apps/web/app/utils/request-portal-cache-key.ts`,
`apps/web/app/utils/route-param-value.ts`,
`apps/web/tests/async-data-problem.spec.ts`,
`apps/web/tests/request-file-display.spec.ts`,
`apps/web/tests/request-next-step.spec.ts`,
`apps/web/tests/request-portal-cache-key.spec.ts`,
`apps/web/tests/route-param-value.spec.ts`.

**Prisma в dest (не копировать историю миграций Нордщита):**
`apps/api/prisma/schema.prisma` — rewrite; `apps/api/prisma/seed.ts` — rewrite;
в dest одна initial migration. `core`: техническая модель (аналог F1 probe), без
`Request`. `portal`: модели `Request*` как сейчас, без комментариев «demo catalog».

### Denylist (никогда в dest)

`apps/api/src/requests/domain/request-catalog.ts`,
`apps/api/src/requests/domain/live-request-fixture.ts`,
`apps/api/src/requests/http/demo-links.controller.ts`,
`apps/api/src/requests/http/demo-conductor.controller.ts`,
`apps/api/src/requests/application/get-demo-links.use-case.ts`,
`apps/api/src/requests/application/get-demo-links.use-case.spec.ts`,
`apps/api/src/requests/application/get-conductor-snapshot.use-case.ts`,
`apps/api/src/requests/application/advance-live-request.use-case.ts`,
`apps/api/src/requests/application/reset-live-request.use-case.ts`,
`apps/api/src/requests/application/load-live-request-for-conductor.ts`,
`apps/api/src/requests/application/load-live-request-for-conductor.spec.ts`,
`apps/api/src/requests/application/conductor-auth.port.ts`,
`apps/api/src/requests/application/request-live-command.port.ts`,
`apps/api/src/requests/application/live-request-advance-conflict.error.ts`,
`apps/api/src/requests/application/request-fixture-mismatch.error.ts`,
`apps/api/src/requests/infrastructure/env-conductor-auth.ts`,
`apps/api/prisma/migrations/`,
`apps/web/app/pages/start.vue`,
`apps/web/app/pages/c/`,
`apps/web/app/utils/live-cabinet-poll.ts`,
`apps/web/app/utils/bind-live-cabinet-poll.ts`,
`apps/web/tests/live-cabinet-poll.spec.ts`,
`apps/web/tests/bind-live-cabinet-poll.spec.ts`,
`apps/web/server/api/start-request.post.ts`,
`apps/web/server/api/conductor/`,
`packages/api-client/openapi.json`,
`packages/api-client/src/schema.d.ts`,
`packages/api-client/src/index.spec.ts`,
`scripts/lifecycle-targets.spec.mjs`,
`e2e/`, `playwright.config.ts`,
`docs/llm/feature-NN.md`, `docs/ux/`, `docs/source-brief.md`,
`docs/demo-scenarios.md`, `docs/domain-model.md`, `docs/implementation-status.md`,
`.agents/skills/implement-review-cycle/`, `.agents/skills/pr-review/`,
`.agents/skills/github-remote/`,
`pnpm-lock.yaml`, `.env`, `node_modules/`, `dist/`,
`apps/api/src/generated/`.

### Rewrite смешанных файлов (dest outcome; не invent)

| Путь                                                                                  | Пресет         | Результат в dest                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/app.module.ts`                                                          | оба            | `core`: `ConfigModule` + logging + `HealthModule` + problem filter; **нет** `RequestsModule`, **нет** `ThrottlerModule`. `portal`: то же + `RequestsModule` (только portal) + `ThrottlerModule` GET secret. Нет импортов demo/conductor.                      |
| `apps/api/src/requests/requests.module.ts`                                            | `portal`       | `controllers: [RequestPortalController]`. Providers: lookup use-case, Prisma repo, `REQUEST_QUERY`. **Нет** DemoLinks/DemoConductor/live/conductor. Файл отсутствует в `core`.                                                                                |
| `apps/api/prisma/seed.ts` и `apply-request-seed.ts`                                   | оба / `portal` | `core`: `prisma/seed.ts` — no-op **без** импорта `requests/`. `portal`: `apply-request-seed.ts` + `seed.ts` — идемпотентный no-op. **Нет** `REQUEST_CATALOG`, live fixture, `deleteMany` `notIn` каталога. Файл `apply-request-seed.ts` отсутствует в `core`. |
| `apps/api/src/requests/http/map-application-error.ts`                                 | `portal`       | Только `RequestNotFoundError` → 404. **Нет** `LiveRequestAdvanceConflictError` / 409 live. Файл отсутствует в `core`.                                                                                                                                         |
| `apps/api/src/health/health.http.spec.ts`                                             | оба            | Fixture env **без** `DEMO_CONDUCTOR_SECRET`.                                                                                                                                                                                                                  |
| `apps/api/src/requests/domain/request.ts`                                             | `portal`       | `RequestPortalView` **без** `demoLive`.                                                                                                                                                                                                                       |
| `apps/api/src/requests/application/get-request-by-access-secret.use-case.ts` (+ spec) | `portal`       | Lookup по хешу секрета. **Нет** `live-request-fixture`, **нет** spread `demoLive`. Spec без З-10046.                                                                                                                                                          |
| `apps/api/src/openapi/document.ts`                                                    | оба            | `setTitle(--brand)`. Paths = оставшиеся controllers: `core` только health; `portal` health + `GET /requests/{accessSecret}`. Нет `/demo/links` и conductor.                                                                                                   |
| `apps/api/src/openapi/openapi.contract.spec.ts`                                       | оба            | Assert только путей dest. Нет `/demo/links`, нет `demoLive`.                                                                                                                                                                                                  |
| `apps/web/nuxt.config.ts`                                                             | оба            | Scope/порты из флагов. `routeRules`: `/`; `portal` ещё `/r/**`. **Нет** `/start`, `/c/**`. **Нет** `runtimeConfig.demoConductorSecret`.                                                                                                                       |
| `apps/web/app/pages/index.vue`                                                        | оба            | Заглушка бренда (бренд шапки не heading). **Нет** «Ссылки для показа», **нет** `$api.GET('/demo/links')`, **нет** ссылок `/start` и `/c/`.                                                                                                                    |
| `apps/web/app/pages/r/[accessSecret]/index.vue`                                       | `portal`       | Кабинет. **Нет** импорта `live-cabinet-poll` / poll-фразы. Бренд в title = `--brand`.                                                                                                                                                                         |
| `apps/api/src/bootstrap/create-application.ts`                                        | оба            | **Нет** hook Cache-Control на `/demo/conductor`. CORS: `GET`, `HEAD`, `OPTIONS` (без `POST`).                                                                                                                                                                 |
| `apps/api/src/core/config/api-env.ts` (+ spec)                                        | оба            | **Нет** `DEMO_CONDUCTOR_SECRET`. Default `API_PORT` = `--api-port`.                                                                                                                                                                                           |
| `compose.yaml`, `.env.example`, `.github/workflows/ci.yml`                            | оба            | Имена от `--name`, порты от флагов. **Нет** `DEMO_CONDUCTOR_*`, `nordshield`.                                                                                                                                                                                 |
| `Makefile`                                                                            | оба            | Порты/project от флагов. `compose-smoke` — health, не дисклеймер индекса. **Нет** `pnpm test:e2e` / Playwright в dest.                                                                                                                                        |
| `scripts/compose-smoke.mjs`                                                           | оба            | Проверка `GET /api/v1/health/ready` и контейнеров с префиксом `--name`. **Нет** фразы «не показывается заказчику».                                                                                                                                            |
| `scripts/check-boundaries.mjs`, `scripts/test-packages.mjs` (+ spec)                  | оба            | Зашитый `@client-portal` в **копии** → `--scope`. Этот git не трогать.                                                                                                                                                                                        |
| `apps/web/app/layouts/default.vue`                                                    | оба            | Тексты `ПК «Нордщит»` → `--brand`.                                                                                                                                                                                                                            |
| `packages/api-client/src/index.ts`                                                    | оба            | Импорт `--scope/openapi-client-core`; фасад без generated schema Нордщита (schema появляется после `generate:api` в dest).                                                                                                                                    |

Не копировать as-is и не оставлять висячие импорты театра: после rewrite dest должен typecheck по смыслу пресета (фактически проверяет S6 для core packages; web/api generate:api — тоже S6).

## Что не входит ни в одну фичу

Коннекторы amo/1С, чат, OTP, upload файлов, каталог SKU, mock-api,
админка менеджера (кроме индекса и пульта показа, D-049), Kubernetes, Redis,
логин / парольная форма / HTTP 401, общее PATCH `/requests/{secret}`,
таймаут авто-продвижения как основной режим, мутация каталога З-10041…З-10045,
портал Protostar / деплой / переименование `@client-portal` в этом git.
