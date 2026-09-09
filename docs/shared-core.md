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

Пакеты скопированы из `demo_b2b` по playbook переноса. Обратный перенос в Вольтарис — только
для domain-less правок с package-local tests.
