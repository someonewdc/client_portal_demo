# Реализуй фичу 5: Playwright harness (`pnpm test:e2e`)

## Цель

Фичи 6–7 должны писать e2e **до** страниц. Этот шаг только ставит Playwright и корневой
script `test:e2e`. Сценариев индекса и кабинета здесь нет. Здесь же проверяется, что Nuxt
на `:3000` отдаёт HTML-каркас (это снято с AC фичи 3).

## Зависимости

Фичи 1–4 в `main` (web в `make dev`, layout с шапкой). Фич 6–8 нет.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`, `docs/implementation-plan.md`
- `docs/testing.md`, `docs/decisions.md` (D-006, D-012, D-016, D-020, D-021)
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- корневой `package.json`, `Makefile`
- `apps/web`

## Контекст продукта

ПК «Нордщит». Запрещено: mock-api, фиктивный server вместо стенда, `waitForTimeout`, e2e
списка ссылок и кабинета (это фичи 6 и 7).

## Стек и границы

- Заведи корневой script **`pnpm test:e2e`** (имени ещё нет).
- `baseURL` = `http://localhost:3000`.
- Smoke: в **шапке layout** виден «ПК «Нордщит»»; страница на `:3000` отвечает HTML.
- Smoke **без API**. Если нужен Playwright `webServer` — только Nuxt, и обязательно
  `reuseExistingServer: true` (D-021). Не занимай `:3000` вторым процессом, если web уже
  поднят через `make dev`.
- Сценарии с API **не** добавлять и **не** стартовать ими второй Nuxt. Они появятся в
  фичах 6–7 и ходят в уже поднятый `make dev` + seed.
- CI e2e полного стенда — фича 8, против `make up`, не против встроенного `webServer`.
- Селекторы: role / label / осмысленный `data-testid`.

## TDD

1. Добавь spec «на `/` в layout виден ПК «Нордщит»» и script `test:e2e`.
2. Запусти `pnpm test:e2e` — **red**, если script/spec нет.
3. Не пиши дисклеймер мессенджера, 5 номеров, клик на `/r/…`, тупик 404.

## Что сделать

- Playwright в workspace, `pnpm test:e2e`, D-021.
- Один smoke по layout фичи 4.
- Зафиксируй в README/Makefile, как гонять e2e локально (через существующие цели, не сырой
  `npx playwright`, если можно обернуть).

## Что не делать

- Экраны индекса и кабинета.
- `reuseExistingServer: false` на `:3000`.
- CI e2e job полного стенда (фича 8).
- Пушить в `main`.

## Критерии приёмки

- `pnpm test:e2e` существует и гоняет smoke шапки на `:3000`.
- `reuseExistingServer: true`, если есть `webServer`.
- Нет сценария `GET /demo/links` / кабинета / битой ссылки.
- Нет `waitForTimeout` как синхронизации.
- Нет mock-api.

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

Обнови `docs/implementation-status.md` (red и green).

## Git

Feature-ветка, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность harness → `docs/decisions.md`, не угадывать.
