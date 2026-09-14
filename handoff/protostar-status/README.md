# Перенос в `protostar-status`

Это **не** документы демо Нордщита. Их нельзя класть в `docs/` этого git
(`client_portal_demo`). Пакет собран, чтобы вырезать в репозиторий после
`scripts/scaffold-new-workspace.mjs --preset portal`.

Локально клон уже может лежать рядом:
`/Users/ivanklimenko/studio_common/artifacts/protostar_client_portal`
(`@protostar`, порты `3100` / `3101` / `5434`).

## Куда копировать

Из этой папки:

| Здесь       | В корне dest |
| ----------- | ------------ |
| `AGENTS.md` | `AGENTS.md`  |
| `docs/`     | `docs/`      |

Потом удалите `handoff/protostar-status/` из `client_portal_demo`. Не коммитьте
этот handoff в `main` Нордщита.

## Как открыть работу

1. Cursor → Open Folder на **dest**, не на этот репозиторий.
2. Первый чат: «прочитай `AGENTS.md` и `docs/README.md`». Код `apps/*` не просите,
   пока не закроете открытые пункты в `docs/decisions.md` (hostname, имя
   вымышленного заказчика, как менеджер двигает статус).
3. Код — отдельным чатом: `реализуй задачу N` (промпт `docs/llm/task-NN.md`).

Маркетинговый сайт `protostar_site` и демо «Вольтарис» (`demo_b2b`) **не** этот
репозиторий. Их не копировать в `apps/`.
