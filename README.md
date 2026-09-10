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
  индекс `/` из `GET /demo/links`; кабинет `/r/{secret}`, HTML-лист `/r/{secret}/d/{fileName}`
  (D-029) и тупик 404
- Playwright: `pnpm test:e2e` / `make e2e` (smoke шапки, индекс, кабинет, битая ссылка на
  `:3000`)
- PostgreSQL в Docker на хосте `5433`, Prisma 7 в `apps/api`
- `make up` — полный стенд web+api+postgres; CI e2e гоняет те же спеки против него
- план и промпты: `docs/README.md`, `docs/implementation-plan.md`; дефекты после
  F13 — `docs/remediation-plan.md` (`выполни задачу N`)

mock-api нет и не появится.

## Запуск

Нужны Node.js `24.18.0` и pnpm `11.21.0`.

```bash
make bootstrap
cp .env.example .env
make up
```

`make up` поднимает Postgres на `:5433`, API на `:3001` и web на `:3000`, применяет
миграции и seed. Индекс: `http://localhost:3000`. `make dev` останавливает compose `api`/`web`
(если их поднял `up`), освобождает leftover Nest/Nuxt (`node`) на `:3000`/`:3001` и гоняет API/web на хосте
(hot reload), Postgres остаётся в Docker. `make restart` = `down` + `dev`: гасит контейнеры
и leftover `node` на `:3000`/`:3001`/`:5433` (Docker Desktop / `docker-proxy` не убивает), затем
поднимает стенд заново. `make down` тоже забирает leftover-`node` на этих портах. Агентам — только цели Makefile, не сырой
`docker compose` / `pnpm dev` (D-013). Один стенд на машине для `:3000`/`:3001`
(`docs/decisions.md` D-006, D-028).

Проверки: `make verify` (D-018: полный `up` + migrate + `generate:api` + diff generated
client, корневые gates, compose-smoke, `playwright install --with-deps chromium`, e2e).
Сырой `pnpm test` без живой БД падает на HTTP ready=200 — это не полный аналог CI.

E2E: `make e2e` и `make verify` ставят Chromium (`pnpm exec playwright install --with-deps
chromium`) и гоняют спеки против полного стенда `make up` или против `make dev` + seed.
Сырой `pnpm test:e2e` браузер не ставит. `baseURL` — `http://localhost:3000`. Индексный
spec ходит в `GET /demo/links`; кабинетный — в `GET /requests/{accessSecret}` и в API
`:3001`. Nuxt без API недостаточен. Если `:3000` уже занят стендом, локальный Playwright
его переиспользует (`reuseExistingServer: true`, D-021) и не стартует второй Nuxt. В CI
`webServer` выключен: job поднимает `make up` и гоняет `pnpm test:e2e`.

Пакеты private, `0.0.0`. Публикация в registry не входит.
