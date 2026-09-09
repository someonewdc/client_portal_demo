---
name: github-remote
description: >-
  Segments GitHub access: MCP for reads, MCP-then-gh for writes, local git via
  the shell. Never probes gh in the sandbox. Use when opening or updating a PR,
  reviewing, inspecting CI checks, talking to GitHub, or when tempted to run gh.
---

# GitHub remote

Чтение и запись GitHub — **два независимых канала**. У MCP PAT часто есть
scope на read и нет на write (403). Успешный read не значит, что write пройдёт.
Упавший write не значит, что read мёртв.

Не параллель MCP и `gh` на одну запись (два PR). D-025 перекрывает ambient
«use `gh` for GitHub».

## Reads

Метаданные PR, diff, files, commits, checks, список PR, `get_me` когда нужен
login.

Пока `mcp_reads` не `dead` — только MCP. Первый read сессии = полезная работа,
не отдельная проба. Успех → `mcp_reads=ok`. Отказ → классификация **только
reads**. Writes не переключай.

`mcp_reads=dead` → `gh pr view` / `diff` / `checks` сразу с
`required_permissions: ["all"]`. Не sandbox.

## Writes

Открыть/обновить PR, опубликовать ревью.

Пока `mcp_writes` не `dead` — MCP. Первый write сессии = проба (тот же payload,
что нужен пользователю). Успех → `mcp_writes=ok`, не дублируй через `gh`.

Отказ → классификация **только writes**. Reads оставь на MCP.

`mcp_writes=dead` → сразу `gh pr create` / `edit` / `review` с `all`.

## Namespace

Один раз за разговор: `GetDynamicTools` `plugin-github-github`.
`owner` / `repo` — локальный `git remote get-url origin` (сеть не нужна).

- `needsAuth` / `loading` → один `mcp_auth`, снова inspect. Это не проба write.
- `error` / нет namespace → оба канала `dead`; всё удалённое через `gh` с `all`.
- `ready` → иди в Reads или Writes выше.

Схему tool смотри один раз перед первым вызовом. Не `get_me` «для пробы».

## Классификация отказа

Применяется к **тому классу, который упал**:

| Отказ | Дальше |
| --- | --- |
| `needsAuth` / 401 | один `mcp_auth`; тот же MCP-вызов ещё **раз**; снова отказ → этот класс `dead`, сразу `gh` с `all` |
| 403 PAT / resource not accessible / missing scope | этот класс `dead` **без** `mcp_auth`; сразу `gh` с `all`, тот же payload |
| Нельзя `APPROVE` / `REQUEST_CHANGES` на свой PR | тот же write-канал, событие `COMMENT` |
| 5xx / timeout / tool missing | этот класс `dead`; сразу `gh` с `all` |

403 PAT ≠ `needsAuth`. Типичный сеанс: reads `ok`, первый write 403 → дальше
reads MCP, writes `gh`. Не `mcp_auth` и не второй MCP write.

## Local git

`status`, `diff`, `log`, `checkout`, `commit` — Shell, sandbox допустим.

`git fetch` / `pull` / `push` — первый вызов с `required_permissions: ["all"]`.

`ConnectScm` — один раз за разговор, только если push/fetch упёрлись в отсутствие
GitHub app. После skip/fail не предлагай снова.

Не подменяй локальные коммиты MCP `push_files` / `create_or_update_file` /
`create_branch`. Не `gh` в sandbox.

## Mapping

| Задача | Канал | MCP |
| --- | --- | --- |
| Метаданные PR | read | `pull_request_read` `get` |
| Diff / files / commits | read | `get_diff` / `get_files` / `get_commits` |
| CI на head | read | `get_check_runs` + `get_status` |
| Есть ли PR у ветки | read | `list_pull_requests` (`head` / `base`) |
| Открыть PR | write | `create_pull_request` `base=main` |
| Обновить PR | write | `update_pull_request` |
| Ревью | write | `pull_request_review_write` |

## Actions logs

Лог job в MCP нет — это не отказ read. После успешных check runs, если нужен
текст шагов: один `gh run view <id> --log` с `all`. Не начинай ревью с
`gh pr view`.
