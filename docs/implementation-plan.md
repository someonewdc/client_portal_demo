# План реализации

Каждая фича — отдельный чат, feature-ветка, один PR в `main`. Промпт:
`docs/llm/feature-NN.md`. TDD: тесты до кода (`AGENTS.md`, `docs/testing.md`).

## Что уже есть в заготовке

- pnpm workspace, Node 24.18.0, pnpm 11.21.0
- packages: `tsconfig`, `eslint-config`, `platform-core`, `nestjs-core`,
  `openapi-client-core`
- `apps/api`: health live/ready; `API_PORT=3001`, `WEB_ORIGIN=http://localhost:3000`
- Root scripts (копировать буквально): `build:core`, `dev` (только API), `build`, `lint`,
  `check:boundaries`, `typecheck`, `test`, `test:packages`, `format`, `format:check`
- Makefile: только `bootstrap`, `doctor`
- CI: lint, boundaries, typecheck, test, test:packages, build — без Postgres
- ESLint уже игнорирует будущие `apps/api/src/generated/prisma/**` и
  `packages/api-client/src/schema.d.ts`
- `generateOpaqueToken` / `hashOpaqueToken`

## Чего ещё нет (фича должна завести; AC проверяет имя script)

| Имя                                           | Где появится                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm db:generate` / `db:migrate` / `db:seed` | фича 1                                                                                                                                       |
| Makefile `up` / `down` / `dev` / `verify`     | фича 1: `up` = только Postgres :5433; `dev` = db+api. Фича 3 добавляет web в `dev`. Фича 6 расширяет тот же `up` до web+api+postgres (D-016) |
| `DATABASE_URL`, compose Postgres, Prisma 7    | фича 1                                                                                                                                       |
| `pnpm generate:api`, `packages/api-client`    | фича 2                                                                                                                                       |
| `apps/web`, Nuxt, Tailwind `@theme`           | фича 3                                                                                                                                       |
| `pnpm test:e2e`, Playwright harness           | фича 3                                                                                                                                       |
| экраны `/` и `/r/{secret}`                    | фичи 4 и 5                                                                                                                                   |
| compose-smoke приложений, CI e2e              | фича 6 (если не закрыто раньше)                                                                                                              |

Не выдумывай другие имена. Если нужен новый script — заведи его в той фиче, чей AC это
требует, и запиши в `package.json`.

## Порядок

```text
docs (этот набор) → 1 Postgres/Prisma/ready
                  → 2 заявка + OpenAPI + api-client
                  → 3 Nuxt + токены + Playwright harness
                  → 4 индекс (e2e red, затем страница)
                  → 5 кабинет + 404 (e2e red, затем страница)
                  → 6 compose-smoke + CI e2e
```

Зависимость: фича N в `main` до старта N+1.

## Что не входит ни в одну фичу

Коннекторы amo/1С, чат, OTP, upload файлов, редактирование статусов, каталог, mock-api,
админка менеджера, Kubernetes, Redis.
