# Реализуй задачу 12 / фичу 26: не-root пользователь в Docker

Пользователь написал «выполни задачу 12». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Контейнеры `api` и `web` запускают Node не от root. Порты и команды `CMD` те же.

## Зависимости

Фичи 1–25 в `main`. Фичу 27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-012, D-016, D-018, D-030)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `Dockerfile`
- `scripts/lifecycle-targets.spec.mjs`
- `scripts/compose-smoke.mjs`

## Контекст продукта

Полный стенд `make up`. Запрещено: Kubernetes, новый compose-сервис, смена портов
(это фича 27).

## Стек и границы

- [`Dockerfile`](../../Dockerfile): в стадиях `api` и `web` после COPY —
  `USER node` (образ `node:24.18.0-bookworm-slim` уже имеет пользователя `node`).
  Если файлы в `/app` недоступны `node`, сделай `chown -R node:node` **до** USER.
- Не менять `CMD`, `EXPOSE`, build stages смысл.
- `compose.yaml` порты не трогать (фича 27).

## TDD (red до Dockerfile)

1. `node --test scripts/lifecycle-targets.spec.mjs`: Dockerfile для стадий api и
   web содержит `USER node` (после последнего COPY той стадии). Текущий main —
   **red**.
2. Реализация USER/chown.
3. Проверка стенда: `make up` затем `node scripts/compose-smoke.mjs` — exit 0.
   Если Docker недоступен — запиши **не проверено**, не выдумывай.
4. Если lifecycle сразу green — перепиши assert. Не `skip`/`xit`.

## Что не делать

- Bind `127.0.0.1` (фича 27).
- Менять healthcheck command на curl (в образе нет curl — оставь `node -e fetch`).
- Пушить в `main`.

## Критерии приёмки

- Given image api и web, Then процесс не root (`USER node` в Dockerfile).
- Given `make up`, Then compose-smoke по-прежнему проходит (если Docker запускался).
- Red evidence lifecycle есть до green.

## Проверки

```bash
node --test scripts/lifecycle-targets.spec.mjs
pnpm check:boundaries
pnpm lint
pnpm format:check
git diff --check
```

`pnpm test` продукта не обязателен, если менялся только Dockerfile — но если
гонял, запиши. Не утверждай compose-smoke без запуска. Обнови
`docs/implementation-status.md`.

## Git

Ветка `fix/docker-nonroot-user`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 13» → `docs/llm/feature-27.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано.

## Стоп

Неоднозначность → `docs/decisions.md`. Не меняй базовый image tag без нужды.
