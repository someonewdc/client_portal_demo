# Правила packages/openapi-client-core

- Пакет не импортирует generated schema и параметризуется `Paths` вызывающего проекта.
- Здесь живут только transport concerns: base URL, correlation, network и Problem Details errors.
- Project-specific endpoints/types остаются в `packages/api-client`.
- Изменение middleware/error semantics требует package-local Vitest и consumer client test.
- Новый продукт генерирует свой `Paths`; schema этого репозитория не копируется
  ([`docs/shared-core.md`](../../docs/shared-core.md)).
