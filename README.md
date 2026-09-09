# client_portal_demo

Демо клиентского канала статуса (Protostar): заявка ПК «Нордщит» по ссылке, не витрина
Вольтариса. Предметные экраны появляются фичами `docs/llm/feature-NN.md`.

## Сейчас

- packages: `tsconfig`, `eslint-config`, `platform-core`, `nestjs-core`,
  `openapi-client-core`
- `apps/api`: `GET /api/v1/health/live`, `GET /api/v1/health/ready` (ready зависит от
  Postgres)
- PostgreSQL в Docker на хосте `5433`, Prisma 7 в `apps/api`
- план и промпты: `docs/README.md`, `docs/implementation-plan.md`

## Ещё нет (заводят фичи 2–6)

Nuxt, generated `api-client`, Playwright. mock-api нет и не появится.

## Запуск

Нужны Node.js `24.18.0` и pnpm `11.21.0`.

```bash
make bootstrap
cp .env.example .env
make up
make dev
```

`make up` поднимает только Postgres на `:5433`. `make dev` — Postgres + API на `:3001`.
Агентам — только цели Makefile, не сырой `docker compose` / `pnpm dev` (D-013). Web origin
`http://localhost:3000` — один стенд на машине для `:3000`/`:3001` (`docs/decisions.md`
D-006).

Проверки: `make verify` или `pnpm db:generate`, `pnpm check:boundaries`, `pnpm lint`,
`pnpm typecheck`, `pnpm test`, `pnpm test:packages`, `pnpm build`.

Пакеты private, `0.0.0`. Публикация в registry не входит.
