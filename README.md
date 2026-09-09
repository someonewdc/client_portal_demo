# client_portal_demo

Демо клиентского канала статуса (Protostar): заявка ПК «Нордщит» по ссылке, не витрина
Вольтариса. Предметные экраны появляются фичами `docs/llm/feature-NN.md`.

## Сейчас

- packages: `tsconfig`, `eslint-config`, `platform-core`, `nestjs-core`,
  `openapi-client-core`, generated `api-client` (`pnpm generate:api`; `openapi.json` /
  `schema.d.ts` руками не править)
- `apps/api`: `GET /api/v1/health/live`, `GET /api/v1/health/ready` (ready зависит от
  Postgres), `GET /api/v1/demo/links`, `GET /api/v1/requests/{accessSecret}`
- `apps/web`: Nuxt 4.5.2 на `:3000`, Tailwind v4 `@theme`, IBM Plex, документный layout;
  индекс `/` из `GET /demo/links`
- Playwright: `pnpm test:e2e` / `make e2e` (smoke шапки и индекс ссылок на `:3000`)
- PostgreSQL в Docker на хосте `5433`, Prisma 7 в `apps/api`
- план и промпты: `docs/README.md`, `docs/implementation-plan.md`

## Ещё нет (заводят фичи 7–8)

Кабинет `/r/{secret}`, compose-smoke, CI e2e. mock-api нет и не появится.

## Запуск

Нужны Node.js `24.18.0` и pnpm `11.21.0`.

```bash
make bootstrap
cp .env.example .env
make dev
```

`make up` поднимает только Postgres на `:5433`. `make dev` зависит от `up` и поднимает API
на `:3001` и web на `:3000`. Агентам — только цели Makefile, не сырой `docker compose` /
`pnpm dev` (D-013). Один стенд на машине для `:3000`/`:3001` (`docs/decisions.md` D-006).

Проверки: `make verify` (D-018: Postgres + migrate + `generate:api` + diff generated
client, затем корневые gates). Сырой `pnpm test` без живой БД падает на HTTP ready=200 —
это не полный аналог CI.

E2E: один раз `pnpm exec playwright install chromium`, затем против живого стенда
`make dev` (db+api+web) + seed — `make e2e` / `pnpm test:e2e`. `baseURL` —
`http://localhost:3000`. Индексный spec ходит в `GET /demo/links`; Nuxt без API
недостаточен. Если `:3000` уже занят `make dev`, Playwright его переиспользует
(`reuseExistingServer: true`, D-021) и не стартует второй Nuxt. Сценарий кабинета —
фича 7; CI e2e — фича 8.

Пакеты private, `0.0.0`. Публикация в registry не входит.
