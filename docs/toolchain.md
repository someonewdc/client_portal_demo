# Toolchain

Версии совпадают с исходным ядром `demo_b2b` и фиксируются `package.json`, `.nvmrc` и
`pnpm-lock.yaml`. Перед установкой: `nvm use`, затем `node --version` = `v24.18.0` и
`pnpm --version` = `11.21.0` (Corepack).

| Компонент  |  Версия | Где закреплено                             |
| ---------- | ------: | ------------------------------------------ |
| Node.js    | 24.18.0 | `.nvmrc`, `.node-version`, CI `setup-node` |
| pnpm       | 11.21.0 | `packageManager`, `Makefile` `bootstrap`   |
| TypeScript |   5.9.3 | root и package manifests                   |
| NestJS     | 11.1.29 | `apps/api`, `packages/nestjs-core`         |
| Fastify    |  5.11.0 | `apps/api`, peer `nestjs-core`             |
| Zod        |   4.4.3 | `platform-core`, `apps/api`                |
| Vitest     |  4.1.10 | compiled packages и `apps/api`             |
| ESLint     |  9.39.5 | `packages/eslint-config` peers             |

Nuxt 4, Prisma 7, Playwright и PostgreSQL **в заготовке ещё нет**. Их заводят фичи 1 и 3;
патч-версии сверяют с официальными docs и lockfile в том чате. Не угадывать версии в
документах заранее. Порты стенда — `docs/decisions.md` (D-006).

CI (`.github/workflows/ci.yml`) пинит third-party actions на commit SHA. `pnpm/action-setup`
идёт до `actions/setup-node` с `cache: pnpm`. Фича 1 добавит Postgres в CI; фича 6 — e2e,
если harness уже есть.
