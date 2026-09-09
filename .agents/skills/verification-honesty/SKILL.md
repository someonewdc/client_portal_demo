---
name: verification-honesty
description: >-
  Reports work as executed, verified, unverified, or blocked with exact
  commands and results. Use when finishing a task, updating implementation
  status, writing a PR body, or claiming that tests, CI, or acceptance passed.
---

# Verification honesty

Не утверждай успех без запуска. «Должно работать» — не результат.

## Отчёт

Разделяй явно:

- **выполнено** — что изменено;
- **проверено** — точная команда и exit/результат;
- **не проверено** — не запускалось, с причиной;
- **заблокировано** — что остановило и чем.

Пиши команду целиком, не «прогнал тесты». Targeted test изменённого поведения обязателен.
Root gates — по `change-impact-gates`, не по памяти.

TDD этого репозитория (`AGENTS.md`, `docs/testing.md`): targeted-тесты по AC пишут **до**
кода. В status обязателен red-прогон (команда, exit ≠ 0, причина). Тест, который был
зелёным до реализации поведения, — false positive: перепиши, не подгоняй код под слабый
assert. Не `skip`/`xit` и не меняй ожидаемые значения «чтобы прошло».

Playwright: без `waitForTimeout` как синхронизации; role / label / test-id. Scenario-mutating
E2E — serial. Skip, `xit`, flake-retry без фикса ≠ покрытие. E2E экранов пишут в фичах 6–7
до страниц, не после вёрстки. Harness — фича 5.

CI зелёный — skill `pr-review`: jobs реально бежали на **этом** head SHA.

`docs/implementation-status.md`: новая строка журнала, не перезапись истории. Этап
`проверен` только с evidence.

## Do not

- Маскировать пропуск формулировкой «должно быть достаточно».
- Считать skipped job успехом.
- Записывать в status чужой прошлый прогон как доказательство этой поставки.
