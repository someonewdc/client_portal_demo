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
boundary. API сам отвечает 404, если хеш не найден.

`GET /demo/links` отдаёт `portalPath` со секретом только потому, что это служебный экран
ведущего. Не выдавать этот список за кабинет заказчика.

## Слои Nest

Skill `nestjs-hexagonal-boundaries`:

- Controller: class-validator, вызов use case, envelope. Нет Prisma и business rules.
- Application кидает typed errors без `HttpException`.
- HTTP map на границе → Nest exception → Problem Details.
- Prisma только в infrastructure repository + mapper. Generated client:
  `apps/api/src/generated/prisma`.

## OpenAPI и клиент

Когда появится фича 2: `pnpm generate:api` пишет `packages/api-client`. Web — один facade
над `createProblemAwareClient<Paths>`. Prefix `/api/v1` на base URL.

## Стенд

Lifecycle — корневой Makefile (цели заводит фича 1 и расширяют 3/6): `bootstrap`, `dev`,
`up`, `down`, `verify` по факту файла.

Порты — `docs/decisions.md`. Один стенд на машине для `:3000`/`:3001`.
