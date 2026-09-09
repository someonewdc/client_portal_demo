# Правила apps/api

Сначала корневой `AGENTS.md`, `docs/implementation-status.md` и `docs/product-scope.md`.
Предметные поставки — только `docs/llm/feature-NN.md` (домен заявки — фича 2, не каталог).

- Controller — тонкий HTTP adapter.
- Prisma только в infrastructure (`src/persistence`) и health adapter. Generated client:
  `src/generated/prisma`.
- Domain/application не импортирует Nest HTTP и Prisma.
- Env — `validateApiEnv` поверх `@client-portal/platform-core/environment`; `DATABASE_URL`
  обязателен.
