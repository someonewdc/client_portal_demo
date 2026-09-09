# Правила apps/api

Сначала корневой `AGENTS.md`, `docs/implementation-status.md` и `docs/product-scope.md`.

Сейчас в приложении только health. Не добавляй каталог, кабинет, Prisma или внешние adapters
без явного prompt.

- Controller — тонкий HTTP adapter.
- Prisma (когда появится) только через repository.
- Domain/application не импортирует Nest HTTP и Prisma.
- Env — `validateApiEnv` поверх `@client-portal/platform-core/environment`.
