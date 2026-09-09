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
Это не пользователь, не сессия, не cookie-login. Route middleware Nuxt — UX, не security
boundary. API сам отвечает 404, если хеш не найден. Cookie не форвардить (D-015).

`GET /demo/links` отдаёт `portalPath` со секретом только потому, что это служебный экран
ведущего. Не выдавать этот список за кабинет заказчика.

Логи и 404: D-014. Path с секретом в access-логе и в `instance` допустим; `detail` и
отдельные поля лога — нет. `nestjs-core` serializer не трогать.

## Слои Nest

Skill `nestjs-hexagonal-boundaries`:

- Controller: class-validator, вызов use case, envelope. Нет Prisma и business rules.
- Application кидает typed errors без `HttpException`.
- HTTP map на границе → Nest exception → Problem Details.
- Prisma только в infrastructure repository + mapper. Generated client:
  `apps/api/src/generated/prisma`. Ready проверяет БД через Prisma `$queryRaw` `SELECT 1`.

## OpenAPI и клиент

`pnpm generate:api` пишет `packages/api-client` (types-only `Paths`; facade `createApiClient`
— фича 3). Web — один facade над `createProblemAwareClient<Paths>`. Prefix `/api/v1` на
base URL.

## Стенд

Lifecycle — корневой Makefile (цели заводит фича 1 и расширяют 3/6): `bootstrap`, `dev`,
`up`, `down`, `verify` по факту файла. Смысл `up`/`dev` — D-016: сначала только Postgres,
потом `dev`+web, потом тот же `up` = полный стенд. `verify` — D-018: `up` + migrate +
gates.

Порты — `docs/decisions.md`. Один стенд на машине для `:3000`/`:3001`.
