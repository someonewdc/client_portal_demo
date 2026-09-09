# Статус реализации

## Текущее состояние

Фича 1 (Docker Postgres + Prisma 7 + ready зависит от БД) реализована на ветке
`feat/postgres-prisma-ready`. Домена заявки, Nuxt и `api-client` ещё нет.

## Правила обновления

1. Менять status только после фактического изменения.
2. Этап `проверен` только с evidence команды.
3. Не заменять доказательство предположением.
4. Для предметной фичи записывай red-прогон и green-прогон (TDD).

## Этапы

| Этап                             | Состояние                         |
| -------------------------------- | --------------------------------- |
| Boilerplate workspace            | проверен                          |
| Документы плана и промпты фич    | выполнен (main `cad60b4`, без PR) |
| Правки контракта по ревью        | выполнен (main `95767dc`, PR #1)  |
| Фича 1 Postgres/Prisma/ready     | проверен                          |
| Фича 2 заявка + OpenAPI          | не начат                          |
| Фича 3 Nuxt + Playwright harness | не начат                          |
| Фича 4 индекс ссылок             | не начат                          |
| Фича 5 кабинет + 404             | не начат                          |
| Фича 6 compose-smoke / CI e2e    | не начат                          |

## Журнал проверки

| Дата       | Что                | Команда                                                                                                                                                | Результат                                                                                                           |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 2026-09-09 | Создание заготовки | `pnpm install`                                                                                                                                         | exit 0, pnpm 11.21.0, 7 workspace projects                                                                          |
| 2026-09-09 | Создание заготовки | `pnpm build:core`                                                                                                                                      | exit 0, tsc platform-core → nestjs-core → openapi-client-core                                                       |
| 2026-09-09 | Создание заготовки | `pnpm check:boundaries`                                                                                                                                | exit 0                                                                                                              |
| 2026-09-09 | Создание заготовки | `pnpm lint`                                                                                                                                            | exit 0                                                                                                              |
| 2026-09-09 | Создание заготовки | `pnpm typecheck`                                                                                                                                       | exit 0                                                                                                              |
| 2026-09-09 | Создание заготовки | `pnpm test`                                                                                                                                            | exit 0: platform-core 29, nestjs-core 3, openapi-client-core 3, api 2, scripts 24                                   |
| 2026-09-09 | Создание заготовки | `pnpm test:packages`                                                                                                                                   | exit 0: 5 tarballs, 17 ESM imports, 3 TypeScript consumers                                                          |
| 2026-09-09 | Создание заготовки | `pnpm build`                                                                                                                                           | exit 0                                                                                                              |
| 2026-09-09 | Создание заготовки | `pnpm format` затем `pnpm format:check`                                                                                                                | format:check сначала fail (8 файлов), после `pnpm format` — exit 0                                                  |
| 2026-09-09 | Документы плана    | `pnpm format`                                                                                                                                          | exit 0                                                                                                              |
| 2026-09-09 | Документы плана    | `pnpm format:check`                                                                                                                                    | exit 0                                                                                                              |
| 2026-09-09 | Документы плана    | `git diff --check`                                                                                                                                     | exit 0                                                                                                              |
| 2026-09-09 | Документы плана    | `pnpm lint` / `pnpm test`                                                                                                                              | не запускались: docs-only (`change-impact-gates`)                                                                   |
| 2026-09-09 | Правки по ревью    | `pnpm format`                                                                                                                                          | exit 0                                                                                                              |
| 2026-09-09 | Правки по ревью    | `pnpm format:check`                                                                                                                                    | exit 0                                                                                                              |
| 2026-09-09 | Правки по ревью    | `git diff --check`                                                                                                                                     | exit 0                                                                                                              |
| 2026-09-09 | Правки по ревью    | `pnpm lint` / `pnpm test`                                                                                                                              | не запускались: docs-only (`change-impact-gates`)                                                                   |
| 2026-09-09 | Фича 1 TDD red     | `pnpm --filter @client-portal/api exec vitest run src/core/config/api-env.spec.ts src/health/readiness.service.spec.ts src/health/health.http.spec.ts` | exit 1: `DATABASE_URL` не в результате env; ready после `markReady` даёт 200 при недоступной БД; ping не вызывается |
| 2026-09-09 | Фича 1 TDD red     | `node --test scripts/lifecycle-targets.spec.mjs`                                                                                                       | exit 1: нет `db:generate`/`db:migrate`/`db:seed` и Makefile `up`/`down`/`dev`/`verify`                              |
| 2026-09-09 | Фича 1 migrate     | `make up` затем `pnpm db:migrate` затем `pnpm db:seed`                                                                                                 | exit 0; container `client-portal-postgres`; `5432/tcp -> 0.0.0.0:5433`; migration `20260909120000_runtime_probe`    |
| 2026-09-09 | Фича 1 TDD green   | `pnpm --filter @client-portal/api exec vitest run src/core/config/api-env.spec.ts src/health/readiness.service.spec.ts src/health/health.http.spec.ts` | exit 0: 3 files, 9 tests                                                                                            |
| 2026-09-09 | Фича 1 TDD green   | `node --test scripts/lifecycle-targets.spec.mjs`                                                                                                       | exit 0: 3 tests                                                                                                     |
| 2026-09-09 | Фича 1 gates       | `pnpm db:generate`                                                                                                                                     | exit 0, Prisma Client 7.10.0 → `apps/api/src/generated/prisma`                                                      |
| 2026-09-09 | Фича 1 gates       | `pnpm check:boundaries`                                                                                                                                | exit 0                                                                                                              |
| 2026-09-09 | Фича 1 gates       | `pnpm lint`                                                                                                                                            | exit 0                                                                                                              |
| 2026-09-09 | Фича 1 gates       | `pnpm typecheck`                                                                                                                                       | exit 0                                                                                                              |
| 2026-09-09 | Фича 1 gates       | `pnpm test`                                                                                                                                            | exit 0: platform-core 29, nestjs-core 3, openapi-client-core 3, api 9, scripts 27                                   |
| 2026-09-09 | Фича 1 gates       | `pnpm test:packages`                                                                                                                                   | exit 0: 5 tarballs, 17 ESM imports, 3 TypeScript consumers                                                          |
| 2026-09-09 | Фича 1 gates       | `pnpm build`                                                                                                                                           | exit 0                                                                                                              |
| 2026-09-09 | Фича 1 gates       | `pnpm format` затем `pnpm format:check`                                                                                                                | exit 0                                                                                                              |
| 2026-09-09 | Ревью F1 TDD red   | `node --test scripts/lifecycle-targets.spec.mjs`                                                                                                       | exit 1: `verify` prerequisites `'' !== 'up'`                                                                        |
| 2026-09-09 | Ревью F1 TDD green | `node --test scripts/lifecycle-targets.spec.mjs`                                                                                                       | exit 0: 4 tests                                                                                                     |
| 2026-09-09 | Ревью F1           | `pnpm --filter @client-portal/api exec vitest run src/health/readiness.service.spec.ts src/health/health.http.spec.ts`                                 | exit 0: 2 files, 6 tests                                                                                            |
| 2026-09-09 | Ревью F1           | `make verify`                                                                                                                                          | exit 0: `up` healthy, migrate applied, gates + api 9, scripts 28                                                    |
