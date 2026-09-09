# client_portal_demo

Заготовка pnpm workspace для демо клиентского канала статуса (Protostar). Это не витрина
Вольтариса и пока не сам продукт: ядро, ворота и Nest API с health.

## Сейчас

- packages: `tsconfig`, `eslint-config`, `platform-core`, `nestjs-core`, `openapi-client-core`
- `apps/api`: `GET /api/v1/health/live`, `GET /api/v1/health/ready`
- агентный договор: корневой `AGENTS.md` и `.agents/skills/`

## Ещё нет

Prisma, Nuxt, generated OpenAPI client, mock-api, страница заявки по секретному URL.

## Запуск

Нужны Node.js `24.18.0` и pnpm `11.21.0`.

```bash
make bootstrap
cp .env.example .env
pnpm dev
```

Проверки: `pnpm check:boundaries`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
`pnpm test:packages`, `pnpm build`.

Пакеты private, `0.0.0`. Публикация в registry не входит в эту заготовку.
