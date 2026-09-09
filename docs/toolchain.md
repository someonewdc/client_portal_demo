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
| Nuxt       |   4.5.2 | `apps/web` (D-022)                                            |
| Vue        |  3.5.42 | `apps/web`, официальный Nuxt 4.5 starter                      |
| Tailwind   |   4.3.3 | `apps/web` (`tailwindcss`, `@tailwindcss/vite`; D-023)        |
| IBM Plex   |   5.3.0 | `@fontsource/ibm-plex-sans` (D-015, D-023)                    |
| Playwright |  1.63.0 | root `@playwright/test` (D-024)                               |

Tailwind v4 `@theme` и документный layout — фича 4 (D-023). Playwright harness — фича 5
(D-024). Порты стенда — `docs/decisions.md` (D-006, D-017).

CI (`.github/workflows/ci.yml`) пинит third-party actions на commit SHA. `pnpm/action-setup`
идёт до `actions/setup-node` с `cache: pnpm`. Фича 1 добавила Postgres в CI; фича 8 — e2e,
если harness уже есть.
