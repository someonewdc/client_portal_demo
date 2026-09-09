# Реализуй фичу 6: compose-smoke полного стенда + CI e2e

## Цель

Демо должно подниматься одной командой Makefile и проверяться в CI так же, как локально:
счастливый путь и битая ссылка уже написаны в фичах 4–5 — их не переписывать «под стенд».
Этот шаг — воспроизводимый стенд и ворота, не новая вёрстка.

## Зависимости

Фичи 1–5 в `main` (экраны и Playwright-сценарии есть).

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`, `docs/implementation-plan.md`
- `docs/acceptance-checklist.md`, `docs/demo-scenarios.md`
- `docs/decisions.md` (D-006, D-013)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `.agents/skills/pr-review/SKILL.md`
- `.agents/skills/docker-reclaim-space/SKILL.md`
- `Makefile`, `.github/workflows/ci.yml`, compose-файлы фичи 1
- существующие Playwright spec фич 4–5

## Контекст продукта

ПК «Нордщит», индекс + кабинет. Запрещено: mock-api, Kubernetes, Redis, переписывание e2e
после прогона «чтобы CI стал зелёным» без бага в продукте, `waitForTimeout`.

## Стек и границы

- Compose recipe полного стенда (web + api + postgres), имена/порты свои: web 3000, api
  3001, db host 5433. Один стенд на машине для app-портов.
- Dockerfile приложений — минимальные, не копия Вольтариса как продукт. Смотреть Вольтарис
  только как composition root.
- Lifecycle: `make up` / `make down` / `make verify` по факту Makefile. Агентам не
  предписывать сырой `docker compose`, кроме skill.
- CI: e2e на том же head SHA; не badge.

## TDD

E2e счастливого пути и 404 **уже должны быть** с фич 4–5. Не пиши их заново после UI.

Для compose-smoke:

1. Опиши проверку: после `make up` (или документированной цели полного стенда)
   `GET /api/v1/health/ready` 200 и `/` отдаёт дисклеймер.
2. Запусти против **ещё неполного** compose приложений — **red**, если smoke ещё нет.
3. Потом Dockerfiles/compose/CI.
4. Запрещено удалять assert e2e 4–5 или сужать grep, чтобы job прошёл.

## Что сделать

- Полный стенд в Compose + цели Makefile, если их нет.
- CI job: Postgres (если ещё нужно), `test:e2e` на существующие спеки.
- `make verify` включает применимые gates + e2e, когда стенд позволяет.
- Короткая заметка в корневом `README.md`: как поднять демо через Makefile.

## Что не делать

- Новые экраны, каталог, mock-api, ослабление e2e.
- `docker compose down -v` как «лечение» диска (`docker-reclaim-space`).
- Пушить в `main`.

## Критерии приёмки

- Given чистый checkout фич 1–5, When `make up` (полный стенд) и seed, Then ready 200 и
  индекс открывается.
- `pnpm test:e2e` гоняет сценарии индекса, кабинета З-10043 и битой ссылки.
- CI запускает e2e (не skip) на PR.
- Нет новых мёртвых UI.
- Существующие e2e не переписаны «подгоном» без изменения продукта.

## Проверки

```bash
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
pnpm test:e2e
```

`generate:api` / `db:generate` — только если трогал контракт/схему. Обнови
`docs/implementation-status.md`.

## Git

Feature-ветка, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR (дифф + реальные CI jobs на head
SHA).

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Для нового smoke — red и green.

## Стоп

Неоднозначность портов/compose → `docs/decisions.md`, не занимать чужой стенд вслепую.
