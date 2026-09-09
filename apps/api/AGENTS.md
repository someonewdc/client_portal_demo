# Правила apps/api

Сначала корневой `AGENTS.md`, `docs/implementation-status.md` и `docs/product-scope.md`.
Предметные поставки — только `docs/llm/feature-NN.md` (Prisma — фича 1–2, не каталог).

- Controller — тонкий HTTP adapter.
- Prisma (когда появится) только через repository.
- Domain/application не импортирует Nest HTTP и Prisma.
- Env — `validateApiEnv` поверх `@client-portal/platform-core/environment`.
