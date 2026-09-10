# Реализуй задачу 4 / фичу 18: неполный каталог → 500

Пользователь написал «выполни задачу 4». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

`GET /demo/links` падает закрыто, если в БД нет всех пяти `publicNumber` каталога
(включая пустую таблицу). Лишняя неизвестная строка по-прежнему 500 (D-019). Сиды
и секреты не менять.

## Зависимости

Фичи 1–17 в `main`. Фичи 19–27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-012, D-019, D-030, D-031)
- `docs/domain-model.md` (таблица пяти номеров)
- `docs/api-contracts.md`
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nestjs-hexagonal-boundaries/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/api/src/requests/application/get-demo-links.use-case.ts`
- `apps/api/src/requests/application/get-demo-links.use-case.spec.ts`
- `apps/api/src/requests/application/request-fixture-mismatch.error.ts`
- `apps/api/src/requests/domain/request-catalog.ts`
- `apps/api/src/requests/requests.http.spec.ts`

## Контекст продукта

ПК «Нордщит». Индекс ведущего должен показать ровно пять сидов. Усечённый список —
сломанный стенд, не empty. Запрещено: логин на `/demo/links`, новые секреты, mock-api.

## Стек и границы

- Application: `GetDemoLinksUseCase` + тот же `RequestFixtureMismatchError`.
- После успешного map всех строк: множество `publicNumber` должно равняться
  множеству `REQUEST_CATALOG` (ровно 5, те же номера). Иначе throw.
- HTTP map 500 уже есть (немапленный application error → Problem Details 500).
  Не превращай mismatch в 4xx.
- Web empty state не удалять (D-031). OpenAPI schema не менять: 500 уже допустим.
- `pnpm generate:api` не запускать, если OpenAPI не менялся.

## TDD (red до use-case)

1. Unit
   `pnpm --filter @client-portal/api exec vitest run src/requests/application/get-demo-links.use-case.spec.ts`:
   - один валидный хеш каталога (как в текущем «happy» тесте, но **без** остальных
     четырёх номеров) → `RequestFixtureMismatchError`;
   - пустой `listRequestSummaries()` → тот же error;
   - полный набор пяти номеров каталога → 200-логика как сейчас;
   - extra unknown hash → error (уже есть).
     Текущий main: один валидный row проходит — этот новый кейс **red**.
2. HTTP (предназначенная dev-БД): после `deleteMany` одной каталожной заявки
   `GET /api/v1/demo/links` → 500 problem+json, `detail` без SQL/stack. Затем
   `applyRequestSeed` лечит. Добавь it в `requests.http.spec.ts`. **red** до кода.
3. Реализация только в use-case (сравнение с `REQUEST_CATALOG`). Не дублируй каталог
   в HTTP.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что не делать

- Менять seed, fixture-секреты, OpenAPI, Vue.
- Auth на `/demo/links`.
- Пушить в `main`.

## Критерии приёмки

- Given БД без З-10043, Then `GET /demo/links` 500, не 4 items.
- Given пустая таблица, Then 500, не `{ items: [] }`.
- Given полный seed, Then по-прежнему 5 items 1:1.
- Given orphan hash, Then по-прежнему 500 (D-019).
- Red evidence есть до green.

## Проверки

```bash
pnpm --filter @client-portal/api exec vitest run src/requests/application/get-demo-links.use-case.spec.ts src/requests/requests.http.spec.ts
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`pnpm db:generate` не нужен, схему не меняешь. Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `fix/demo-links-complete-catalog`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 5» → `docs/llm/feature-19.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-031. Не меняй D-008 секреты.
