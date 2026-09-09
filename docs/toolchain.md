# Toolchain

Версии совпадают с исходным ядром `demo_b2b` и фиксируются `package.json`, `.nvmrc` и
`pnpm-lock.yaml`. Перед установкой: `nvm use`, затем `node --version` = `v24.18.0` и
`pnpm --version` = `11.21.0` (Corepack).

| Компонент  |  Версия | Где закреплено                                                |
| ---------- | ------: | ------------------------------------------------------------- |
| Node.js    | 24.18.0 | `.nvmrc`, `.node-version`, CI `setup-node`                    |
| pnpm       | 11.21.0 | `packageManager`, `Makefile` `bootstrap`                      |
| TypeScript |   5.9.3 | root и package manifests                                      |
| NestJS     | 11.1.29 | `apps/api`, `packages/nestjs-core`                            |
| Fastify    |  5.11.0 | `apps/api`, peer `nestjs-core`                                |
| Zod        |   4.4.3 | `platform-core`, `apps/api`                                   |
| Vitest     |  4.1.10 | compiled packages и `apps/api`                                |
| ESLint     |  9.39.5 | `packages/eslint-config` peers                                |
| Prisma     |  7.10.0 | `apps/api` (`prisma`, `@prisma/client`, `@prisma/adapter-pg`) |
| PostgreSQL |      17 | `compose.yaml`, CI service; хост 5433 (D-006, D-017)          |
| Nuxt       |   4.5.2 | `apps/web` (D-022); без Tailwind/PostCSS (D-011, D-020)       |
| Vue        |  3.5.42 | `apps/web`, официальный Nuxt 4.5 starter                      |

Tailwind, CSS-pipeline и `@theme` — фича 4, Playwright — фича 5. Порты стенда —
`docs/decisions.md` (D-006, D-017).

CI (`.github/workflows/ci.yml`) пинит third-party actions на commit SHA. `pnpm/action-setup`
идёт до `actions/setup-node` с `cache: pnpm`. Фича 1 добавила Postgres в CI; фича 8 — e2e,
если harness уже есть.
