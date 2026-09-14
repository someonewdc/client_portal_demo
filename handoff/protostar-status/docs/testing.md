# Тестирование

Тесты пишут до кода, по приёмке из `docs/llm/task-NN.md`.

## Что гонять

Корневые scripts dest: `pnpm test` (workspace + `check-boundaries` /
`test-packages` / `free-stand-ports` specs), `pnpm lint`, `pnpm typecheck`,
`pnpm check:boundaries`, `pnpm generate:api` если менялся HTTP.

HTTP и кабинет — обязательный red→green. Playwright в dest нет: не добавляй e2e
Нордщита. Приёмка экрана — Vitest/Nuxt unit там, где уже есть web tests, плюс
HTTP spec API. Браузер вручную: `make up` и открыть `/r/{secret}`.

## Честность

Команда целиком в `docs/implementation-status.md`. Не «должно работать». Не skip
и не смена ожиданий «чтобы прошло».
