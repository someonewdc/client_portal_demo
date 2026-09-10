# Реализуй задачу 10 / фичу 24: throttle GET заявки по секрету

Пользователь написал «выполни задачу 10». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Перебор `GET /api/v1/requests/{accessSecret}` ограничен in-memory throttler Nest.
Health и `GET /demo/links` не лимитировать. Redis не добавлять.

## Зависимости

Фичи 1–23 в `main`. Фичи 25–27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-012, D-030)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nestjs-hexagonal-boundaries/SKILL.md`
- `.agents/skills/foundation-package-conventions/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/api/src/requests/http/request-portal.controller.ts`
- `apps/api/src/requests/requests.module.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/requests/requests.http.spec.ts`
- `packages/nestjs-core/src/problem-details.ts` (429 уже есть в title map)
- [NestJS throttler](https://docs.nestjs.com/security/rate-limiting)

## Контекст продукта

Fixture-секреты угадываемые (D-008 — не менять). Лимит — защита от грубого перебора
на открытом стенде, не auth. Запрещено: Redis, логин, OTP.

## Стек и границы

- `@nestjs/throttler` в `apps/api` (версия совместимая с Nest 11 / lockfile).
- Default: **60 запросов / 60 секунд на IP клиента** (`ThrottlerGuard` tracker = IP,
  не path и не `accessSecret`) на `GET :accessSecret` контроллера портала.
  Перебор разных секретов с одного IP должен упираться в тот же лимит.
- In-memory storage модуля. Не Redis и не `@ThrottlerStorageRedis` / Redis-гайд Nest.
- `@SkipThrottle()` на health и `DemoLinksController`.
- Guard только на `RequestPortalController` (или global + skip остальных).
- 429 → уже существующий Problem Details filter (`Too many requests`).
- Тестовый override: отдельный describe с `limit: 1` через переопределение
  модуля, **не** снижая default так, чтобы e2e (десятки GET) падали.
- Product rate limit не класть в `nestjs-core`.

## TDD (red до guard)

1. Новый it: поднять app с `ttl` 60_000 и `limit` 1 на portal; первый
   `GET /api/v1/requests/unknown-secret-a` → 404; второй
   `GET /api/v1/requests/unknown-secret-b` (тот же тестовый IP, другой path) →
   **429** `application/problem+json`, `detail` без секрета и SQL. Ключ — IP, не
   path: два разных unknown secret с одного IP должны делить лимит.
   `pnpm --filter @client-portal/api exec vitest run src/requests/requests.http.spec.ts`
   — **red**.
2. Существующие it того же файла при default 60/min остаются green (мало inject).
3. Подключи throttler. Не меняй seed и OpenAPI, если 429 уже описан как problem.
   `generate:api` только если добавил `@ApiResponse` 429 — тогда да и
   `git diff --exit-code` после generate.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что не делать

- Redis, Kubernetes, auth.
- Throttle `/demo/links` и health.
- Менять fixture-секреты.
- Пушить в `main`.

## Критерии приёмки

- Given limit=1 в тесте, Then второй GET того же IP (другой unknown secret) —
  429 Problem Details.
- Given default 60/min, Then текущие HTTP и e2e наборы не упираются в лимит.
- Given health/demo links, Then без 429 от этого лимита.
- Red evidence есть до green.

## Проверки

```bash
pnpm --filter @client-portal/api exec vitest run src/requests/requests.http.spec.ts src/health/health.http.spec.ts
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

E2E не обязателен в этой фиче, если HTTP покрыл 429; не утверждай e2e без запуска.
Обнови `docs/implementation-status.md` (red и green).

## Git

Ветка `fix/request-secret-throttle`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 11» → `docs/llm/feature-25.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не добавляй Redis «как в гайде Nest».
