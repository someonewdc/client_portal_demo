# Правила packages/nestjs-core

- Пакет содержит только domain-less NestJS/Fastify infrastructure и зависит внутрь от
  `@client-portal/platform-core`.
- Импорты из `apps/*`, Prisma, provider adapters и generated contracts запрещены.
- App-specific CORS, uploads, rate limits, readiness dependencies и Swagger metadata остаются в app.
- Configurable infrastructure оформляется typed dynamic module/options; public API — только subpath exports.
- Изменение bootstrap/error/logging behavior требует package test и consumer tests обоих Nest apps.
- Перенос в другой Nest workspace — [`docs/shared-core.md`](../../docs/shared-core.md).
