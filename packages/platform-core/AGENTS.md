# Правила packages/platform-core

- Пакет не импортирует NestJS, Vue/Nuxt, Prisma, приложения или generated OpenAPI schema.
- Public API добавляется только отдельным subpath export в `package.json`; root junk-drawer barrel запрещён.
- Код не использует термины каталога, RFQ или внешних providers этого проекта.
- Node-only механизм допустим только в явно названном subpath, как `/opaque-token`.
- Process-local mock stores в этот пакет не входят. `mock-core` в workspace сейчас нет.
- Для branching utility обязателен package-local Vitest.
- Перенос в другой workspace — [`docs/shared-core.md`](../../docs/shared-core.md); не
  копировать `apps/*`.
