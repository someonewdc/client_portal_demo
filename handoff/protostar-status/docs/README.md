# Навигатор контекста

1. [`../AGENTS.md`](../AGENTS.md)
2. этот файл
3. [`implementation-status.md`](implementation-status.md)
4. промпт [`llm/task-NN.md`](llm/task-01.md), если реализуешь поставку
5. только нужный документ из таблицы

| Задача                        | Документ                                             |
| ----------------------------- | ---------------------------------------------------- |
| Исходное ТЗ (не переписывать) | [`source-brief.md`](source-brief.md)                 |
| Зритель, in/out, 30 секунд    | [`product-scope.md`](product-scope.md)               |
| Заявка, статусы, секрет       | [`domain-model.md`](domain-model.md)                 |
| Черновик HTTP                 | [`api-contracts.md`](api-contracts.md)               |
| Три git, hostname, слои       | [`architecture.md`](architecture.md)                 |
| Документный UI                | [`frontend.md`](frontend.md)                         |
| TDD и ворота                  | [`testing.md`](testing.md)                           |
| Приёмка артефакта             | [`acceptance-checklist.md`](acceptance-checklist.md) |
| Порядок задач                 | [`implementation-plan.md`](implementation-plan.md)   |
| Решения                       | [`decisions.md`](decisions.md)                       |
| Версии стенда                 | [`toolchain.md`](toolchain.md)                       |
| Копируемый промпт задачи N    | [`llm/task-01.md`](llm/task-01.md) …                 |

Код продукта — отдельные чаты по `docs/llm/task-NN.md`. Оператор `реализуй задачу N`.
`спроектируй продукт` документов не подменяет промпт задачи. Стенд — цели
корневого Makefile (`bootstrap`, `up`, `down`, `dev`, `restart`, `verify`).
