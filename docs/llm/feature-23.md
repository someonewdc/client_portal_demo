# Реализуй задачу 9 / фичу 23: timeout OpenAPI-клиента

Пользователь написал «выполни задачу 9». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

`createProblemAwareClient` не ждёт ответ вечно: у запроса есть AbortSignal с
таймаутом по умолчанию 5000 мс. SSR Nuxt не держит воркер, если API завис.

## Зависимости

Фичи 1–22 в `main`. Фичи 24–27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-002, D-012, D-030)
- `docs/shared-core.md`
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/foundation-package-conventions/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `packages/openapi-client-core/src/index.ts`
- `packages/openapi-client-core/src/index.spec.ts`
- `packages/openapi-client-core/package.json`
- `packages/api-client/src/index.ts`

## Контекст продукта

Web зовёт API через `createApiClient` → `createProblemAwareClient`. Домена заявки
в core быть не должно. Запрещено: импорт `apps/*`, Prisma, schema продукта.

## Стек и границы

- Только `@client-portal/openapi-client-core`.
- Default timeout **5000** мс. Опция `timeoutMs?: number` в
  `ProblemAwareClientOptions` (0 или отсутствие override = 5000; явно большее —
  для теста).
- Реализация: свой `fetch` wrapper с `AbortSignal.timeout(timeoutMs)` (Node 24),
  не ломая переданный пользователем `options.fetch` и `signal`.
- Таймаут → существующий `ApiNetworkError` (или тот же onError middleware).
- `createApiClient` в `packages/api-client` не обязан меняться, если default
  наследуется.
- Public API — только declared export. Package test + `pnpm build:core`.

## TDD (red до wrapper)

1. `pnpm --filter @client-portal/openapi-client-core test` (или vitest пакета):
   - клиент с `timeoutMs: 20` и `fetch`, который не резолвится 100+ мс, →
     reject `ApiNetworkError`;
   - при успехе за < timeout ответ как сейчас (correlation + JSON).
     Текущий main — **red**.
2. Реализация в `index.ts`. Не меняй семантику Problem Details.
3. `pnpm build:core` до consumer typecheck.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что не делать

- Product names, Prisma, apps.
- Новый root barrel.
- Менять Nuxt plugin, кроме случая, если без этого не компилится — тогда только
  проброс опции, без UI.
- Пушить в `main`.

## Критерии приёмки

- Given fetch висит дольше timeout, Then `ApiNetworkError`, не бесконечный await.
- Given быстрый 200, Then поведение как в текущих трёх тестах пакета.
- Red evidence есть до green.

## Проверки

```bash
pnpm build:core
pnpm --filter @client-portal/openapi-client-core test
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

Обнови `docs/implementation-status.md` (red и green).

## Git

Ветка `fix/openapi-client-timeout`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 10» → `docs/llm/feature-24.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не тащи `undici` ради таймаута, если есть
`AbortSignal.timeout`.
