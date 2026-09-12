# Реализуй фичу 29: live fixture З-10046 + seed + GET /requests live

Пользователь написал «выполни фичу 29». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

В seed рядом с пятью каталожными заявками появляется одна живая З-10046.
`GET /demo/links` по-прежнему отдаёт ровно пять items З-10041…З-10045.
`GET /requests/{secret}` для живой заявки отдаёт `demoLive: true` и каталог
D-050. Экранов Nuxt, CORS и POST ещё нет.

## Зависимости

Фичи 1–28 в `main` (F28 — docs D-049…D-052). Фичи 30–33 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/domain-model.md` (каталог пяти + живая З-10046)
- `docs/api-contracts.md`, `docs/testing.md`
- `docs/decisions.md` (D-008, D-012, D-014, D-019, D-031, D-049, D-050)
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nestjs-hexagonal-boundaries/SKILL.md`
- `.agents/skills/prisma-persistence-boundary/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/api/src/requests/domain/request-catalog.ts`
- `apps/api/src/requests/infrastructure/apply-request-seed.ts`
- `apps/api/src/requests/application/get-demo-links.use-case.ts`
- `apps/api/src/requests/application/get-demo-links.use-case.spec.ts`
- `apps/api/src/requests/application/get-request-by-access-secret.use-case.ts`
- `apps/api/src/requests/application/get-request-by-access-secret.use-case.spec.ts`
- `apps/api/src/requests/http/request.dto.ts`
- `apps/api/src/requests/http/request-portal.controller.ts`
- `apps/api/src/requests/requests.http.spec.ts`

## Контекст продукта

ПК «Нордщит». Каталог пяти — снепшот для показа разных шагов. Живая заявка —
отдельный fixture для live-сценария, не член индекса. Запрещено: логин, новые
секреты пяти (D-008), mock-api, Vue, CORS, POST conductor.

## Стек и границы

- Hexagon: mapper/use-case; Prisma только infrastructure + seed.
- Пять каталожных остаются в `REQUEST_CATALOG`. Живая — отдельный fixture
  (не член множества demo-links). Не клади З-10046 в `REQUEST_CATALOG`.
- `applyRequestSeed` upsert’ит пять + З-10046 и `deleteMany` вне этого набора.
  Повторный seed сбрасывает З-10046 к `accepted` (одна стадия, один questionnaire).
- `GetDemoLinksUseCase`: успех — ровно пять `publicNumber` каталога в `items`.
  Строка З-10046 в БД — разрешённый extra (не 500, не в `items`). Иная extra /
  неизвестный хеш / неполный каталог пяти — 500 (D-019, D-031, D-050).
- `GET /requests/{accessSecret}`: `demoLive: true` **только** у З-10046; у пяти
  поля нет (omit, не `false`). Даты live — `now()`, не замороженные ISO пяти.
- OpenAPI: опциональное `demoLive` на portal DTO. Руками `openapi.json` /
  `schema.d.ts` нельзя — `pnpm generate:api`.
- Prisma-схему не расширять, если хватает существующих моделей.

## TDD (тесты до кода)

1. HTTP/application тесты по AC **до** правки schema/seed/use-case:
   `pnpm --filter @client-portal/api exec vitest run` на
   `get-demo-links.use-case.spec.ts`,
   `get-request-by-access-secret.use-case.spec.ts`, `requests.http.spec.ts`.
2. Зафиксируй **red** (нет fixture / нет `demoLive` / З-10046 в items или 500 из-за
   extra). Если сразу green — перепиши assert.
3. Потом seed, mapping, `pnpm generate:api`.
4. Не меняй title/спеку/fileName живой заявки и секреты пяти под другую выдумку.
5. Не `skip`/`xit`.

## Что сделать

- Fixture и seed З-10046 1:1 с `docs/domain-model.md` / D-050.
- Fail-closed `/demo/links` с разрешённым extra З-10046.
- `demoLive: true` на GET живой заявки; у пяти omit.
- Обнови `docs/implementation-status.md` (red и green).

## Что не делать

- Vue, e2e страниц, CORS, POST/PATCH conductor, env пульта.
- Мутировать каталог пяти, менять fixture-секреты D-008.
- Логин, cookie, `credentials: 'include'`, HTTP 401.
- Соседние фичи 30–33.
- Пушить в `main`.

## Критерии приёмки

- Given seed, When GET `/demo/links`, Then 5 items З-10041…З-10045, нет З-10046
  в `items`.
- Given seed, When GET `/requests/seed-z10046-live-severnaya-duga`, Then 200,
  `accepted`, `demoLive: true`, один questionnaire file, title/спека из D-050.
- Given extra заявка не из {5 каталог + З-10046}, When GET `/demo/links`, Then 500.
- Given это, When `applyRequestSeed` повторно, Then extra исчезла, З-10046 снова
  `accepted`.
- Red evidence есть до green.

## Проверки

```bash
pnpm --filter @client-portal/api exec vitest run src/requests/application src/requests/requests.http.spec.ts
pnpm generate:api
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`pnpm db:generate` не нужен, схему не меняешь, если моделей не добавлял.
`test:e2e` не обязателен (Vue не трогаешь). Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `feat/live-request-fixture`, PR в `main`. Skill `git-delivery`. Не пушить
в `main`.

## После merge

Skill `pr-review`. Дальше: «выполни фичу 30» → `docs/llm/feature-30.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-050. Не делай фичу 30 (conductor API) и экраны 31–33.
