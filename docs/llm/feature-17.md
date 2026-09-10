# Реализуй задачу 3 / фичу 17: HTTP-статус HTML следует за ошибкой API

Пользователь написал «выполни задачу 3». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Документ Nuxt отдаёт тот же класс статуса, что и сбой API: 404 как сейчас, 5xx/502
больше не маскируются HTML 200. Текст экранов и тупика не переписывать.

## Зависимости

Фичи 1–16 в `main`. Фичи 18–27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-012, D-015, D-030)
- `docs/frontend.md` (состояния loading/error/404)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie **не** применять (D-015).
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/utils/async-data-problem.ts`
- `apps/web/tests/async-data-problem.spec.ts`
- `apps/web/app/pages/index.vue`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `apps/web/app/pages/r/[accessSecret]/d/[fileName].vue`

## Контекст продукта

ПК «Нордщит». Ошибка списка: «Не удалось загрузить список заявок.» Ошибка кабинета:
«Не удалось загрузить заявку.» Тупик 404: «Ссылка недействительна». Запрещено: логин,
менять эти строки, mock-api.

## Стек и границы

- Чистая функция в `apps/web/app/utils/async-data-problem.ts`, например
  `documentStatusFromAsyncData(error, fallback = 200): number`.
- Вызов `setResponseStatus` на индексе, кабинете и листе для **любого** ненулевого
  document status (404 и 5xx), не только `isNotFound`.
- Unit рядом с `async-data-problem.spec.ts`.
- E2E не обязан ломать API. OpenAPI / Prisma не менять.

Правило статуса:

- нет ошибки → `200` (можно не вызывать `setResponseStatus`);
- `statusCode`/`status` 404 → `404`;
- иной код из ошибки (500, 502, 503) → этот код;
- ошибка без кода → `502` (как `statusCodeFromThrown`).

## TDD (red до правки страниц)

1. Unit `pnpm --filter @client-portal/web test`:
   - `{ statusCode: 404 }` → 404;
   - `{ statusCode: 503 }` → 503;
   - `{ status: 500 }` → 500;
   - `undefined` / нет ошибки → 200;
   - `new Error('network')` → 502.
     Запуск — **red**, пока функции нет.
2. Source-контракт (добавь it в `scripts/lifecycle-targets.spec.mjs`):
   `index.vue` и кабинет/лист вызывают `setResponseStatus` не только в ветке
   `isNotFound` (например есть вызов с вычисленным статусом). Текущий main —
   **red**.
3. Подключи хелпер на трёх страницах. Тексты и разметку error/404 не менять.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что не делать

- Менять copy, e2e тексты, API, Prisma.
- `NuxtLink`, заголовки, throttle.
- Cookie / `credentials: 'include'`.
- Пушить в `main`.

## Критерии приёмки

- Given API 503 на `/`, Then HTML-ответ не 200 (document status 503).
- Given неизвестный секрет, Then по-прежнему HTTP 404 и тот же тупик.
- Given успех, Then 200 как сейчас.
- Red evidence есть до green.

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

Ветка `fix/document-error-status`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 4» → `docs/llm/feature-18.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не удаляй empty state «Заявок пока нет».
