# Реализуй задачу 2 / фичу 16: реактивный ключ кабинета

Пользователь написал «выполни задачу 2». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

`useRequestPortal` переживает смену `accessSecret` на том же page-компоненте: ключ
`useAsyncData` и fetch зависят от текущего param, есть `watch`. Ссылки остаются
`<a href>` — `NuxtLink` запрещён (D-034).

## Зависимости

Фичи 1–15 в `main`. Фичи 17–27 не начинать. Фичу 25 (NuxtLink) не делать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-012, D-015, D-030, D-034)
- `docs/remediation-plan.md`
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie / `credentials: 'include'`
  **не применять** (D-015).
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/composables/useRequestPortal.ts`
- `scripts/lifecycle-targets.spec.mjs` (блок feature 7, `useRequestPortal`)
- [Nuxt 4 useAsyncData watch](https://nuxt.com/docs/4.x/api/composables/use-async-data)

## Контекст продукта

ПК «Нордщит». Кабинет и лист делят composable и ключ `request-portal:${secret}`.
Запрещено: логин, cookie, Pinia для server state, mock-api, NuxtLink.

## Стек и границы

- [`apps/web/app/composables/useRequestPortal.ts`](../../apps/web/app/composables/useRequestPortal.ts)
- Чистая функция ключа (в том же файле или `app/utils/`):
  `requestPortalCacheKey(secret)` → `request-portal:${secret}`
- Unit в `apps/web/tests/`
- Source-контракт в [`scripts/lifecycle-targets.spec.mjs`](../../scripts/lifecycle-targets.spec.mjs)
- Страницы не переводить на `NuxtLink`. OpenAPI / Prisma / seed не менять.

## TDD (два red до правки composable)

1. Unit `pnpm --filter @client-portal/web test`:
   `requestPortalCacheKey('seed-z10043-quote-kuznetsov') ===
'request-portal:seed-z10043-quote-kuznetsov'`. **red**, если экспорта нет.
2. `node --test scripts/lifecycle-targets.spec.mjs`: в `useRequestPortal.ts` есть
   `watch` и ключ не является одноразовой интерполяцией константы setup
   (assert: есть `watch`, есть `requestPortalCacheKey` или computed/getter ключ,
   нет единственного литерала `` `request-portal:${accessSecret}` `` без watch).
   Зафиксируй точный assert так, чтобы текущий main был **red**.
3. Реализация: `accessSecret` из `route.params` реактивно; `useAsyncData` с
   реактивным ключом **или** строковый ключ + `watch: [() => route.params.accessSecret]`
   и чтение актуального secret внутри handler. Возвращаемый `accessSecret` — computed
   или актуальный getter, не застывшая строка setup.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что сделать

- Реактивный портал по официальному Nuxt 4 `watch` / computed key.
- Сохранить `useAsyncData`, `createError`, payload `traceId`, D-015.

## Что не делать

- `NuxtLink` (фича 25 / D-034).
- Менять e2e сценарии и тексты экранов.
- Cookie / `credentials: 'include'`.
- API, Prisma, заголовки.
- Пушить в `main`.

## Критерии приёмки

- Given смена `route.params.accessSecret` на том же компоненте, Then ключ и handler
  используют новый секрет (`watch` или computed key в коде).
- Given D-034, Then в `apps/web` по-прежнему нет `NuxtLink`.
- Red evidence (unit и lifecycle) есть до green.

## Проверки

```bash
pnpm --filter @client-portal/web test
node --test scripts/lifecycle-targets.spec.mjs
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`pnpm generate:api` / `pnpm db:generate` не запускать «на всякий случай». Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `fix/reactive-request-portal`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 3» → `docs/llm/feature-17.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не добавляй `NuxtLink` «чтобы проверить watch».
