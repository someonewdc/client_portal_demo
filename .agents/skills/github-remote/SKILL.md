---
name: github-remote
description: >-
  Uses GitHub MCP for remote GitHub API (PRs, checks, reviews, issues) and
  local git via the shell. Never probes gh in the sandbox. Use when opening or
  updating a PR, reviewing, inspecting CI checks, talking to GitHub, or when
  tempted to run gh.
---

# GitHub remote

Удалённый GitHub (PR, checks, review, issues) — MCP `plugin-github-github`.
Локальный git — Shell. `gh` не пробовать, пока MCP доступен.

Этот skill и D-025 в этом репозитории перекрывают ambient правило «use `gh` for
GitHub».

## Channel

1. `GetDynamicTools` на `plugin-github-github`: `namespaceStatus` и схема нужного
   tool. Затем `CallDynamicTool`. `get_me` — один раз за сессию.
2. `ready` → только MCP. Не дублируй вызов через `gh`.
3. `needsAuth` или ошибка авторизации → `mcp_auth`, снова inspect, затем MCP. Не
   падай в `gh` до этого.
4. После auth namespace всё ещё `error` / отсутствует → `gh` сразу с
   `required_permissions: ["full_network"]` или `["all"]`. Никогда default
   sandbox.
5. `owner` / `repo` — из локального `git remote get-url origin` (сеть не нужна).

## Probe ban

- Не запускай `gh` в sandbox «на всякий случай».
- Не повторяй ту же `gh`-команду с сетью после отказа sandbox, если MCP есть.
- Не подменяй локальные коммиты MCP `push_files` / `create_or_update_file` /
  `create_branch`.

## Local git

`status`, `diff`, `log`, `checkout`, `commit` — Shell, sandbox допустим.

`git fetch` / `pull` / `push` — первый вызов с `required_permissions: ["all"]`.
Не делай пробный вызов без прав.

`ConnectScm` — один раз за разговор, только если push/fetch упёрлись в отсутствие
GitHub app. После skip/fail не предлагай снова.

## Mapping

| Задача | MCP |
| --- | --- |
| Метаданные PR | `pull_request_read` `get` |
| Diff / files / commits | `get_diff` / `get_files` / `get_commits` |
| CI на head | `get_check_runs` + `get_status` |
| Есть ли PR у ветки | `list_pull_requests` (`head` / `base`) |
| Открыть PR | `create_pull_request` `base=main` |
| Обновить PR | `update_pull_request` |
| Ревью | `pull_request_review_write` (+ pending comments по схеме MCP) |

Схемы аргументов не угадывай: inspect tool, затем вызов.

## Actions logs

MCP отдаёт check runs, не лог job. Если `pr-review` нужен текст шагов — один
`gh run view <id> --log` с `full_network` **после** того, как MCP уже дал head
SHA и check runs. Не начинай ревью с `gh pr view`.

## Fallback `gh`

Только если MCP недоступен после auth. Тогда сразу с сетевыми правами, без
sandbox-пробы.
