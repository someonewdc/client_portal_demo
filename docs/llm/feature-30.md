# Реализуй фичу 30: conductor API GET/POST + CORS POST + env

Пользователь написал «выполни фичу 30». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Письменный API пульта: GET снимок живой заявки, POST advance и reset по
capability-секрету из env. CORS допускает POST. UI нет.

## Зависимости

Фичи 1–29 в `main` (живая З-10046 уже в seed). Фичи 31–33 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/api-contracts.md`, `docs/domain-model.md`, `docs/testing.md`
- `docs/decisions.md` (D-007, D-012, D-014, D-015, D-049, D-050, D-051, D-052)
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nestjs-hexagonal-boundaries/SKILL.md`
- `.agents/skills/prisma-persistence-boundary/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/api/src/core/config/api-env.ts`, `api-env.spec.ts`
- `apps/api/src/core/config/cors-origins.spec.ts`
- `apps/api/src/bootstrap/create-application.ts`
- `apps/api/src/requests/http/map-application-error.ts`
- `apps/api/src/requests/requests.http.spec.ts`
- `.env.example`, `compose.yaml`, `.github/workflows/ci.yml`

## Контекст продукта

Пульт — служебный экран ведущего (UI — фича 32). API защищён секретом в пути,
как кабинет: не логин, не 401, не cookie. Двигает только З-10046. Каталог пяти
не мутирует. Запрещено: mock-api, Redis, общее PATCH `/requests/{secret}`.

## Стек и границы

- Hexagon: controller → use case → port; Prisma только infrastructure.
- Typed errors без `HttpException`; 404/409 через HTTP map → Problem Details.
- Env: `DEMO_CONDUCTOR_SECRET` обязателен в `validateApiEnv`. Fixture:
  `seed-demo-conductor-nordshield`. Добавь в `.env.example`, `compose.yaml` api
  env и CI. В БД секрет пульта не хранить.
- Сравнение секрета — constant-time.
- OpenAPI path keys: `/demo/conductor/{conductorSecret}`,
  `/demo/conductor/{conductorSecret}/advance`,
  `/demo/conductor/{conductorSecret}/reset`. `pnpm generate:api`.
- GET 200: `publicNumber`, `status`, `statusLabel`, `portalPath`, `nextStatus`,
  `nextStatusLabel` (`null` на `invoice_issued`). Успешный POST — 200, то же
  тело. Advance с `invoice_issued` — 409 Problem Details без изменения.
- CORS: `credentials: false`; methods добавляют `POST`; origin —
  `corsOriginsFromWebOrigin`. Сними source-контракт F22 «нет POST»; PUT/PATCH/
  DELETE по-прежнему нет. Cookie нет.
- JSON conductor: `Cache-Control: private, no-store` (D-051).
- Throttle F24 не расширять на write-пути. Redis не заводить.
- Автомат файлов/стадий — D-052. Даты — `now()`; в тестах не равенство ISO.
- D-014 не менять.

## TDD (тесты до кода)

1. HTTP/CORS тесты **до** роутов: GET fixture 200 и снимок `nextStatus` /
   `nextStatusLabel` (`accepted` → `in_calculation` / `В расчёте`; после
   advance — следующая пара D-007; на `invoice_issued` оба `null`); bad/empty
   secret 404 не 401; POST reset → accepted + 1 file + next `in_calculation` /
   `В расчёте`; POST advance ×3 по таблице D-052 с теми же next-полями;
   четвёртый advance 409; POST не меняет З-10043; CORS methods включают POST,
   credentials false; `validateApiEnv` требует `DEMO_CONDUCTOR_SECRET`.
2. `pnpm --filter @client-portal/api exec vitest run` — **red** (маршрутов нет /
   CORS без POST / env не требует секрет).
3. Потом use cases, controller, CORS, env, `pnpm generate:api`.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что сделать

- Conductor GET/POST по D-051 / `docs/api-contracts.md`.
- Env + CORS POST + Cache-Control JSON.
- OpenAPI generate.
- Обнови `docs/implementation-status.md` (red и green).

## Что не делать

- Vue, `/start`, `/c/{secret}`, poll кабинета (фичи 31–33).
- Логин, парольная форма, cookie, `credentials: 'include'`, HTTP 401.
- Кнопки на кабинете. Таймаут авто-продвижения. PATCH `/requests/{secret}`.
- Мутация каталога пяти. Redis. mock-api.
- Пушить в `main`.

## Критерии приёмки

- Given fixture `seed-demo-conductor-nordshield` и seed (`accepted`), When GET
  `/demo/conductor/{secret}`, Then 200 с полями D-051, `portalPath`
  `/r/seed-z10046-live-severnaya-duga`, `nextStatus` `in_calculation`,
  `nextStatusLabel` `В расчёте`.
- Given неизвестный или пустой секрет, When GET/POST conductor, Then 404
  Problem Details, не 401; `detail` без SQL/stack/секрета.
- Given POST reset, Then живая заявка `accepted`, один questionnaire file;
  GET/тело POST: `nextStatus` `in_calculation`, `nextStatusLabel` `В расчёте`.
- Given POST advance ×3, Then статусы и файлы по таблице D-052; next-поля:
  после 1-го `quote_ready` / `КП готово`; после 2-го `invoice_issued` /
  `Счёт выставлен`; после 3-го статус `invoice_issued` и оба next `null`;
  четвёртый advance — 409 без изменения (next по-прежнему `null`).
- Given POST conductor, Then З-10043 (и остальные каталожные) не меняются.
- Given CORS, Then methods включают POST; `credentials: false`.
- Given `validateApiEnv`, Then без `DEMO_CONDUCTOR_SECRET` — ошибка; в
  `.env.example` есть имя и fixture.
- Red evidence есть до green.

## Проверки

```bash
pnpm --filter @client-portal/api exec vitest run src/core/config src/bootstrap src/requests
pnpm generate:api
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

UI/`test:e2e` не делать. Обнови `docs/implementation-status.md` (red и green).

## Git

Ветка `feat/live-conductor-api`, PR в `main`. Skill `git-delivery`. Не пушить
в `main`.

## После merge

Skill `pr-review`. Дальше: «выполни фичу 31» → `docs/llm/feature-31.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-051. Не делай экраны `/start` и пульт.
