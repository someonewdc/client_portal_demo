---
name: change-impact-gates
description: >-
  Chooses which root gates to run after a change: OpenAPI generate, Prisma
  generate/migrate, check:boundaries, build:core, test:packages. Use when
  editing DTOs, handlers, Prisma schema, package exports, CI, or before
  claiming an implementation complete.
---

# Change impact gates

Не запускай «всё подряд» и не пропускай ворота контракта. Имена scripts сверь с корневым
`package.json` нового workspace.

## Дерево

| Что изменилось | Сначала | Затем |
| --- | --- | --- |
| Runtime DTO / handler / HTTP contract | код | `pnpm generate:api` (не руками `openapi.json` / `schema.d.ts`) |
| Prisma schema | schema | `pnpm db:generate`, новая migration, seed/tests на **предназначенной** БД |
| Package public export / layer / `public.ts` | код | `pnpm check:boundaries` (это не ESLint) |
| Compiled core (`platform-core`, `nestjs-core`, …) | код + package tests | `pnpm build:core` до consumer typecheck/dev/e2e |
| Reusable packages packing | код | `pnpm test:packages` без project `api-client` |
| Только docs | — | Prettier/`git diff --check`; не утверждай, что lint/test продукта прошли |
| Вендорные Prisma skills | lock, не руками | Prettier/`git diff --check`; канон в `apps/api/.agents/skills/` (D-041) |

OpenAPI: `servers[0].url` держит prefix (например `/api/v1`); path keys относительные
(`/health/live`). Client base URL уже с prefix; method path prefix не повторяет.

Prisma: applied migration не редактируй. Destructive reset неизвестной БД запрещён.

После targeted test изменённого поведения — применимые root gates из `AGENTS.md`.
Честность отчёта — skill `verification-honesty`.

## Do not

- Править generated OpenAPI/client вручную, «чтобы check прошёл».
- Править `apps/api/.agents/skills/prisma-*` вручную, «чтобы агент лучше понял».
- Считать ESLint заменой `check:boundaries`.
- Запускать consumer e2e до `build:core`, если core compiled.
