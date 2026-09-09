# client_portal_demo

Демо клиентского канала статуса (Protostar): заявка ПК «Нордщит» по ссылке, не витрина
Вольтариса. Сейчас в git — заготовка + продуктовые документы. Код экранов и Prisma
появляется фичами `docs/llm/feature-NN.md`.

## Сейчас

- packages: `tsconfig`, `eslint-config`, `platform-core`, `nestjs-core`,
  `openapi-client-core`
- `apps/api`: `GET /api/v1/health/live`, `GET /api/v1/health/ready`
- план и промпты: `docs/README.md`, `docs/implementation-plan.md`

## Ещё нет (заводят фичи 1–6)

Prisma/Postgres, Nuxt, generated `api-client`, Playwright, mock-api (и не появится).

## Запуск заготовки

Нужны Node.js `24.18.0` и pnpm `11.21.0`.

```bash
make bootstrap
cp .env.example .env
```

Пока в Makefile нет `dev`/`up` (фича 1), API заготовки: `pnpm dev` на `:3001`. После фичи
1 агентам — только цели Makefile. Web origin `http://localhost:3000` — один стенд на
машине для `:3000`/`:3001` (`docs/decisions.md` D-006).

Проверки: `pnpm check:boundaries`, `pnpm lint`, `pnpm typecheck`, `pnpm test`,
`pnpm test:packages`, `pnpm build`.

Пакеты private, `0.0.0`. Публикация в registry не входит.
