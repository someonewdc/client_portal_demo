# Общее ядро

Ядро не знает заявку, статусы, SKU, CRM или визуальный язык. Импорты только через declared
subpath exports.

```text
apps/api ──> @client-portal/nestjs-core ──> @client-portal/platform-core
             @client-portal/openapi-client-core ──> @client-portal/platform-core
все ──> @client-portal/tsconfig + @client-portal/eslint-config
```

`mock-core` в этом workspace нет. Не копировать `apps/*` Вольтариса. Не публиковать packages,
пока нет license/registry/semver.

Этот git — consumer №1 линейки (`@client-portal`, D-002). Второй workspace — не clone
этого git и не новые exports: генератор `scripts/scaffold-new-workspace.mjs` (D-056,
промпт [`llm/scaffold-new-workspace.md`](llm/scaffold-new-workspace.md)). Театр Нордщита
в копию не входит. Scope **в этом** репозитории не переименовывать.

Пакеты скопированы из `demo_b2b` по playbook переноса. Обратный перенос в Вольтарис — только
для domain-less правок с package-local tests.
