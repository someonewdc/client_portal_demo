# Реализуй фичу 1: Docker Postgres + Prisma + ready зависит от БД

## Цель

Зрителю демо нужна живая «система заявок» завода, а не mock-api. Этот шаг поднимает
PostgreSQL и заставляет `/health/ready` говорить правду: API готов только когда БД
отвечает. Домена заявки ещё нет.

## Зависимости

В `main` должна быть заготовка workspace (health live/ready без БД). Фичи 2–6 ещё нет.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`, `docs/implementation-plan.md`
- `docs/decisions.md` (D-003, D-006, D-010, D-012, D-013, D-016)
- `docs/architecture.md`, `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/prisma-persistence-boundary/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `.agents/skills/docker-reclaim-space/SKILL.md`
- `Makefile`, корневой `package.json`, `.env.example`
- `apps/api/src/health/readiness.service.ts`, `health.controller.ts`, `core/config/api-env.ts`
- `apps/api/package.json`

## Контекст продукта

Protostar показывает канал статуса не-SKU заявки ПК «Нордщит»: ссылка заказчику, не каталог.
Запрещено: mock-api, mock-core, Redis, каталог SKU, чат, OTP, копирование `apps/*`
Вольтариса. «Их система заявок» = Postgres + seed (seed предметных заявок — фича 2).
Один стенд на машине для `:3000`/`:3001`. Postgres на хосте **5433**.

## Стек и границы

- Prisma 7 ESM в `apps/api`: `prisma.config.ts`, client `apps/api/src/generated/prisma`.
- Domain заявки не создавать. Ready проверяет БД через Prisma `$queryRaw` `SELECT 1` (или
  эквивалент). Если генератор требует модель — техническая не-продуктовая таблица, не UI.
- `DATABASE_URL` **обязателен** в `validateApiEnv` (не optional). Обнови
  `apps/api/src/core/config/api-env.spec.ts`: валидный fixture должен содержать
  `DATABASE_URL`. Это новый контракт env, не ослабление assert. Тест «принимает
  boilerplate без `DATABASE_URL`» должен стать red, затем требовать URL.
- Compose: имя проекта/контейнера с префиксом `client-portal-`. Только Postgres, без
  api/web в compose на этом шаге (D-016).
- Не клади Prisma в core packages. `pnpm check:boundaries` обязателен.

## TDD

1. Напиши тесты по AC ниже (ready 503 без БД / 200 с БД; live 200 без БД).
2. Запусти targeted test. Зафиксируй **red**.
3. Потом Prisma, compose, Makefile, проводка readiness.
4. Не подгоняй тест под «ready всегда true».

## Что сделать

- Docker Compose только Postgres (host 5433 → 5432).
- Скрипты в корневом `package.json` (имён ещё нет — заведи именно эти): `db:generate`,
  `db:migrate`, `db:seed` (stub/идемпотентный no-op или пустой seed).
- Makefile: `up` (только Postgres, хост 5433), `down`, `dev` (db + api), `verify`
  (корневые gates заготовки). Не заменяй `bootstrap`/`doctor`. Не клади api/web в
  `up` на этом шаге: фича 8 расширит тот же `up` до полного стенда; порт 5433 не
  менять (D-016).
- CI: сервис Postgres + `DATABASE_URL` на 5432 в job-сети; `db:generate` до typecheck/test
  если types уже импортируются.
- `.env.example`: `DATABASE_URL` на localhost:5433.
- Lifecycle в docs/README агентов — через Makefile, не сырой `docker compose`.

## Что не делать

- Модель заявки, OpenAPI клиента, Nuxt, mock-api.
- `migrate reset` на неизвестной БД.
- Redis, брокер, Kubernetes.
- Пушить в `main`.

## Критерии приёмки

- Given Postgres не запущен, When `GET /api/v1/health/ready`, Then 503 Problem Details.
- Given Postgres healthy и миграции применены, When ready, Then 200 `{ data.status: "ok" }`.
- Given любая БД, When `GET /api/v1/health/live`, Then 200.
- В корневом `package.json` есть `db:generate`, `db:migrate`, `db:seed`.
- В Makefile есть `up`, `down`, `dev`, `verify`.
- `make up` слушает Postgres на 5433 (compose без api/web на этом шаге).
- Нет `apps/mock-api`, нет домена заявки.

## Проверки

По `change-impact-gates`: `pnpm db:generate`, миграция на предназначенной БД, затем

```bash
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`generate:api` и `test:e2e` ещё нет — не выдумывай. Обнови `docs/implementation-status.md`
(red и green).

## Git

Feature-ветка (`feat/…`), PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Раздели: выполнено / проверено (команда + результат) / не проверено / заблокировано.
Обязательны red-прогон и green-прогон.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать. ENOSPC →
`docker-reclaim-space`, не abort.
