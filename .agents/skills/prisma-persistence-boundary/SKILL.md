---
name: prisma-persistence-boundary
description: >-
  Keeps Prisma behind infrastructure in a Prisma 7 ESM Nest app: generated
  client in an app-owned path, db:generate before typecheck, forward-only
  migrations, mappers on the boundary, integer money, and no Prisma types in
  controllers, domain, or the Nuxt app. Use when changing schema, migrations,
  seed, repositories, or generated Prisma client.
---

# Prisma persistence boundary

Вендорные CLI/Client skills (`apps/api/.agents/skills/prisma-cli`,
`prisma-client-api`, `prisma-upgrade-v7`, `prisma-database-setup`) знают команды.
Этот skill — **где** client живёт и куда типы не должны течь. Вендор не
перекрывает D-010 и product-scope (D-041).

## Граница

- Schema, migrate, seed — в API-приложении, не в core packages.
- Generated client — app-owned path (в исходном ядре `apps/api/src/generated/prisma`), не
  `@prisma/client` из `platform-core` / `nestjs-core`.
- `pnpm db:generate` **до** typecheck/test, затронувших Prisma types.
- Applied migration не править; нужна правка — новая migration.
- Prisma types не импортируются в controller, Nuxt, domain, `public.ts`.
- Mapping — чистые функции (см. `prisma-*.mapper.ts` в reference API).
- Деньги — integer minor units, не `float` / JS number arithmetic.
- Core packages Prisma не видят (`check:boundaries` / `platform-core-purity`).

Destructive reset только на disposable/dev БД, которую задача явно назвала. Не `migrate reset`
на неизвестном volume.

После schema change: generate → migrate → seed/idempotency check → repository/mapper tests →
integration на предназначенной БД. См. `change-impact-gates`.

## Do not

- Импортировать Prisma model в application service.
- Класть `output` generator в shared package.
- Менять уже применённый SQL «чтобы CI прошёл».
