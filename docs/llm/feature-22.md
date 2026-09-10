# Реализуй задачу 8 / фичу 22: сузить CORS

Пользователь написал «выполни задачу 8». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

CORS совпадает с реальным API: только безопасные методы чтения, без
`credentials: true` (сессии нет). Origin `localhost` и `127.0.0.1` оба работают,
новый env не заводить.

## Зависимости

Фичи 1–21 в `main`. Фичи 23–27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-006, D-012, D-015, D-030)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/api/src/bootstrap/create-application.ts`
- `apps/api/src/core/config/api-env.ts`
- `apps/api/src/core/config/api-env.spec.ts`
- `apps/api/src/requests/requests.http.spec.ts`

## Контекст продукта

Web на `:3000`, API на `:3001`. Cookie нет (D-015). Запрещено: логин, wildcard
`origin: '*'`, новые обязательные env.

## Стек и границы

- [`apps/api/src/bootstrap/create-application.ts`](../../apps/api/src/bootstrap/create-application.ts)
  `enableCors`:
  - `credentials: false` (или убрать ключ);
  - `methods: ['GET', 'HEAD', 'OPTIONS']`;
  - `origin`: массив из `WEB_ORIGIN` плюс близнец host `localhost` ↔ `127.0.0.1`
    с тем же портом и протоколом. Хелпер — app-local, не product name в
    `platform-core`, если хелпер общий — только URL-математика.
- `WEB_ORIGIN` по-прежнему обязателен и валидируется как сейчас.
- Тест хелпера/CORS в `apps/api` (новый spec рядом с `api-env.spec.ts` или
  bootstrap).

## TDD (red до CORS)

1. Unit `pnpm --filter @client-portal/api exec vitest run` на хелпер origin:
   `http://localhost:3000` → содержит `http://localhost:3000` и
   `http://127.0.0.1:3000`; наоборот то же; `http://example.test:3000` → только
   он (без выдуманного 127.0.0.1). **red**, пока хелпера нет.
2. Source-контракт в `scripts/lifecycle-targets.spec.mjs` или тот же unit: в
   `create-application.ts` нет `credentials: true`, нет `'POST'`/`'PUT'`/`'PATCH'`
   /`'DELETE'` в CORS methods. Текущий main — **red**.
3. Реализация. Не меняй `exactHttpBaseUrlSchema` контракт `WEB_ORIGIN`.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что не делать

- Новые env, cookie, `credentials: 'include'` на web.
- Throttle, Docker, Nuxt.
- Пушить в `main`.

## Критерии приёмки

- Given `WEB_ORIGIN=http://localhost:3000`, Then CORS origin допускает и
  `http://127.0.0.1:3000`.
- Given CORS, Then methods только GET/HEAD/OPTIONS и credentials выключены.
- Red evidence есть до green.

## Проверки

```bash
pnpm --filter @client-portal/api exec vitest run src/core/config src/bootstrap
node --test scripts/lifecycle-targets.spec.mjs
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`pnpm generate:api` не запускать «на всякий случай». Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `fix/cors-read-only`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 9» → `docs/llm/feature-23.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не открывай CORS на `*`.
