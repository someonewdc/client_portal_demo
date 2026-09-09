# Реализуй фичу 5: Playwright harness (`pnpm test:e2e`)

## Цель

Фичи 6–7 должны писать e2e **до** страниц. Этот шаг только ставит Playwright и корневой
script `test:e2e`. Сценариев индекса и кабинета здесь нет.

## Зависимости

Фичи 1–4 в `main` (web на :3000, layout с «Нордщит»). Фич 6–8 нет.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`, `docs/implementation-plan.md`
- `docs/testing.md`, `docs/decisions.md` (D-006, D-012, D-016, D-020)
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
- Минимальный smoke: document/layout содержит «Нордщит». Smoke может стартовать только
  Nuxt (`webServer`); API не мокать. Сценарии с API (индекс/кабинет) будут против
  `make dev` + seed в фичах 6–7.
- Селекторы: role / label / осмысленный `data-testid`.

## TDD

1. Добавь spec «на `/` виден текст ПК «Нордщит»» и script `test:e2e`.
2. Запусти `pnpm test:e2e` до зелёного harness: сначала **red**, если script/spec нет.
3. Не пиши дисклеймер мессенджера, 5 номеров, клик на `/r/…`, тупик 404.

## Что сделать

- Playwright в workspace, `pnpm test:e2e`.
- Один smoke по layout фичи 4.
- Зафиксируй в README/Makefile, как гонять e2e локально (через существующие цели, не сырой
  `npx playwright`, если можно обернуть).

## Что не делать

- Экраны индекса и кабинета.
- CI e2e job полного стенда (фича 8).
- Пушить в `main`.

## Критерии приёмки

- `pnpm test:e2e` существует и гоняет smoke «Нордщит» на `:3000`.
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
