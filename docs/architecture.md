# Архитектура

## Apps

```text
браузер ──> apps/web (Nuxt 4)
               │  generated @client-portal/api-client
               │  @client-portal/openapi-client-core
               ▼
            apps/api (NestJS / Fastify, prefix /api/v1)
               │  hexagon: controller → use case → port
               ▼
            Prisma 7 ──> PostgreSQL (Docker)
```

- `apps/web` не импортирует Prisma, Nest DTO, `apps/api/src`.
- `apps/api` не импортирует Nuxt. Composition root: CORS, readiness, Swagger title, DSN.
- Core packages не знают заявку, Нордщит и Prisma.

mock-api и `mock-core` **нет**. «Система заявок завода» в демо — строки в Postgres после
seed. Не эмулировать внешнюю шину.

## Доступ

Секрет в URL — capability: кто знает путь `/r/{accessSecret}`, тот читает одну заявку.
Это не пользователь, не сессия, не cookie-login. Тот же приём для пульта:
`/c/{conductorSecret}` и `/demo/conductor/{conductorSecret}` — секрет из env
`DEMO_CONDUCTOR_SECRET`, не строка БД (D-051). Route middleware Nuxt — UX, не security
boundary. API сам отвечает 404, если хеш/секрет не найден; неизвестный секрет пульта —
404, не 401. Cookie не форвардить (D-015).

`GET /demo/links` отдаёт `portalPath` со секретом только потому, что это служебный экран
ведущего. Не выдавать этот список за кабинет заказчика. Неполный или пустой каталог пяти —
500, не усечённый список (D-019, D-031; код — фича 18). З-10046 в БД не ломает список
(D-050; код — фича 29). Индекс может содержать ссылку `/c/{secret}`; HTML `/start` —
нет.

Логи и 404: D-014. Path с секретом в access-логе и в `instance` допустим; `detail` и
отдельные поля лога — нет. `nestjs-core` serializer не трогать.

Заголовки capability (D-032, D-051; код — фичи 20–21 и 30–32): HTML `/`, `/r/**`,
`/start`, `/c/**` и JSON `/demo/links` + `/requests/{secret}` + conductor —
`Cache-Control: private, no-store`; web ещё no-referrer / noindex / DENY / nosniff.
Не включать SWR/ISR на `/r/**`. CORS: `credentials: false`; methods с фичи 30 включают
`POST`. Write статусов — только demo/conductor пути, не PATCH `/requests/{secret}`.

## Слои Nest

Skill `nestjs-hexagonal-boundaries`:

- Controller: class-validator, вызов use case, envelope. Нет Prisma и business rules.
- Application кидает typed errors без `HttpException`.
- HTTP map на границе → Nest exception → Problem Details.
- Prisma только в infrastructure repository + mapper. Generated client:
  `apps/api/src/generated/prisma`. Ready проверяет БД через Prisma `$queryRaw` `SELECT 1`.
  Вендорные Prisma CLI/API skills — `apps/api/.agents/skills/` (D-041); не Prisma
  Postgres cloud и не Compute.

## OpenAPI и клиент

`pnpm generate:api` пишет `packages/api-client` (`Paths` и runtime `createApiClient`
над `createProblemAwareClient<Paths>`). Prefix `/api/v1` на base URL. Tailwind v4
`@theme` и layout — `apps/web` (D-023).

## Стенд

Lifecycle — корневой Makefile (цели заводит фича 1 и расширяют 3/8): `bootstrap`, `dev`,
`up`, `down`, `restart`, `verify` по факту файла. Смысл `up`/`dev` — D-016: сначала только
Postgres, потом `dev`+web, с фичи 8 тот же `up` = полный стенд. `restart` — D-028: `down`
(контейнеры + leftover `node` на `:3000`/`:3001`/`:5433`, без kill Docker helpers) и снова
`dev`. `verify` — D-018: `up` + migrate + `generate:api` + diff generated client + gates +
compose-smoke + Chromium + e2e.

Порты — `docs/decisions.md`. Один стенд на машине для `:3000`/`:3001`. Публикация
Compose на хост — `127.0.0.1` (D-033; код — фича 27).
