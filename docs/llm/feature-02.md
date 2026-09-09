# Реализуй фичу 2: домен заявки + seed + OpenAPI + api-client

## Цель

Ведущий и кабинет должны читать одни и те же вымышленные заявки ПК «Нордщит» из Postgres.
Этот шаг даёт контракт и сиды. Экранов Nuxt ещё нет.

## Зависимости

Фича 1 в `main` (Postgres, Prisma, ready, `db:generate` / migrate). Фич 3–6 нет.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`, `docs/implementation-plan.md`
- `docs/domain-model.md`, `docs/api-contracts.md`, `docs/decisions.md` (D-005…D-009, D-012,
  D-014)
- `docs/testing.md`, `docs/architecture.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nestjs-hexagonal-boundaries/SKILL.md`
- `.agents/skills/prisma-persistence-boundary/SKILL.md`
- `.agents/skills/foundation-package-conventions/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/api` health + Prisma wiring из фичи 1
- `packages/openapi-client-core/README.md`
- корневой `package.json` (script `generate:api` ещё нет — заведи)

## Контекст продукта

Канал статуса не-SKU заявки: принят → в расчёте → КП → счёт. Секрет в URL — capability, не
пользователь. 5 сидов из `docs/domain-model.md`, стабильные fixture-секреты. Запрещено:
каталог SKU, mock-api, чат, OTP, upload файлов, смена статусов API, копирование Prisma
каталога Вольтариса.

## Стек и границы

- Hexagon: controller → use case → port; Prisma только infrastructure + mapper.
- Typed application errors без `HttpException`; 404 через HTTP map → Problem Details.
- В БД `accessSecretHash`, не plaintext. Lookup: `hashOpaqueToken`.
- OpenAPI: `servers[0].url` с `/api/v1`; path keys `/demo/links`, `/requests/{accessSecret}`.
- `packages/api-client`: generate only. Руками `openapi.json` / `schema.d.ts` нельзя.
- Web ещё нет — клиент достаточно собрать и typecheck.

## TDD

1. Напиши HTTP/application тесты по AC (`GET /demo/links` 5 items с title/portalPath из
   каталога domain-model; GET fixture 200; unknown secret 404 Problem Details; хеш не равен
   секрету в ответе lookup-пути).
2. Запусти — **red** (маршрутов нет).
3. Потом schema, seed, use cases, `pnpm generate:api`.
4. Не меняй ожидаемый `portalPath`, `title`, `specLines` или `fileName` под другую выдумку.

## Что сделать

- Prisma-модели заявки, строк спецификации, файлов-метаданных, истории статусов — по
  `docs/domain-model.md`.
- Идемпотентный seed пяти заявок **1:1** с каталогом `docs/domain-model.md` (секреты, title,
  specLines, fileName, даты). Не выдумывать строки.
- `GET /demo/links` и `GET /requests/{accessSecret}` как в `docs/api-contracts.md`.
- D-014: не меняй `serializeHttpRequest` / nestjs-core ради редaction path.
- Заведи корневой script `pnpm generate:api`. Не править generated вручную.
- Обнови `db:seed` реализацией (больше не stub).

## Что не делать

- Nuxt, Playwright, mock-api, бинарные PDF, POST/PATCH.
- Импорт Prisma types в controller / domain / будущий web.
- Менять `serializeHttpRequest` / nestjs-core ради редaction path (D-014).
- Пушить в `main`.

## Критерии приёмки

- Given seed применён, When `GET /api/v1/demo/links`, Then 5 items, есть З-10041…З-10045,
  у каждого `title` и `portalPath` из каталога `docs/domain-model.md`.
- Given `seed-z10043-quote-kuznetsov`, When `GET /api/v1/requests/{secret}`, Then 200, статус
  `quote_ready`, 4 `stages`, в files есть `КП-З-10043.pdf`, две specLines как в каталоге.
- Given неизвестный секрет, When GET requests, Then 404 Problem Details: `title` в духе
  «Resource not found»; `detail` без SQL, stack и без plaintext секрета; `instance` и
  access-лог могут содержать path с секретом (D-014). Не меняй nestjs-core serializer.
- `pnpm generate:api` существует; `schema.d.ts` не редактировали руками.
- Seed повторно не плодит дубли и не меняет секреты.

## Проверки

```text
pnpm db:generate
# миграция на предназначенной БД (цель Makefile / db:migrate)
pnpm generate:api
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`test:e2e` ещё нет. Обнови `docs/implementation-status.md` (red и green).

## Git

Feature-ветка, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать.
