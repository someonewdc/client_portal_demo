# Навигатор контекста

1. [`../AGENTS.md`](../AGENTS.md)
2. этот файл
3. [`implementation-status.md`](implementation-status.md)
4. промпт фичи [`llm/feature-NN.md`](llm/feature-01.md), если реализуешь поставку
5. только нужный документ из таблицы

| Задача                        | Документ                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Исходное ТЗ (не переписывать) | [`source-brief.md`](source-brief.md)                                            |
| Зритель, in/out, 30 секунд    | [`product-scope.md`](product-scope.md)                                          |
| Заявка, статусы, секрет, сиды | [`domain-model.md`](domain-model.md)                                            |
| Черновик HTTP                 | [`api-contracts.md`](api-contracts.md)                                          |
| Apps, нет mock-api            | [`architecture.md`](architecture.md)                                            |
| Референсы и два экрана        | [`frontend.md`](frontend.md)                                                    |
| Сценарии показа               | [`demo-scenarios.md`](demo-scenarios.md)                                        |
| TDD, unit/integration/e2e     | [`testing.md`](testing.md)                                                      |
| Приёмка всего демо            | [`acceptance-checklist.md`](acceptance-checklist.md)                            |
| Порядок фич и дыры заготовки  | [`implementation-plan.md`](implementation-plan.md)                              |
| Решения (имя, порты, enum)    | [`decisions.md`](decisions.md)                                                  |
| Ядро packages                 | [`shared-core.md`](shared-core.md)                                              |
| Версии toolchain              | [`toolchain.md`](toolchain.md)                                                  |
| Копируемый промпт фичи N      | [`llm/feature-01.md`](llm/feature-01.md) … [`feature-12.md`](llm/feature-12.md) |

Предметный код пишут отдельные чаты по `docs/llm/feature-NN.md`. В этом наборе документов
кода продукта нет. Стенд — цели корневого Makefile (`bootstrap`, `up`, `down`, `dev`,
`verify`), не сырой `docker compose` (D-013). `verify` поднимает полный стенд, мигрирует,
генерирует api-client и сверяет diff до gates, затем compose-smoke, ставит Chromium и гоняет
e2e (D-018).
