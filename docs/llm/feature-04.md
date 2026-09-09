# Реализуй фичу 4: токены Tailwind и документный layout

## Цель

Зритель должен увидеть лист бумаги, а не серый каркас и не SaaS-дашборд. Этот шаг фиксирует
визуальный язык `docs/frontend.md` на уже существующем `apps/web`. Данных заявок и e2e
сценариев кабинета ещё нет.

## Зависимости

Фичи 1–3 в `main` (`apps/web`, `make dev` с :3000). Фич 5–8 нет.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/decisions.md` (D-005, D-011, D-015, D-020)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web` из фичи 3

## Контекст продукта

ПК «Нордщит», русский документный UI. Запрещено: glassmorphism, нейрослоп, bento, неон,
3D, «AI dashboard», токены Вольтариса, каталог, mock-api.

## Стек и границы

- Tailwind v4 `@theme` в `apps/web`. Значения — таблица в `docs/frontend.md`.
- Шрифт: `@fontsource/ibm-plex-sans` (кириллица), не Google Fonts CDN (D-015).
- Не заводи `test:e2e` (фича 5). Не тяни `GET /demo/links`.

## TDD

1. Targeted-проверка токенов/layout: unit/css contract или компонент-тест, что `@theme`
   содержит paper/ink/accent и что шапка рендерит «ПК «Нордщит»» / колонка документа.
   Если без e2e трудно — тест на наличие токенов в CSS-источнике + рендер layout-компонента.
2. **Red**, потом стили.
3. Не подгоняй под «любой className».

## Что сделать

- Подключить Tailwind v4 и `@theme` по `frontend.md`.
- Layout: бумага, IBM Plex, узкая колонка (~40–42rem), шапка «ПК «Нордщит»».
- `/` остаётся каркасом без фейковых статусов, но уже в этом layout.

## Что не делать

- Playwright, список сидов, кабинет, Dockerfiles.
- Копировать `@theme` Вольтариса.
- Пушить в `main`.

## Критерии приёмки

- Layout: off-white, один акцент стали, IBM Plex из `@fontsource/ibm-plex-sans`, нет
  neon/glass.
- Токены живут в `@theme`, не россыпь arbitrary hex в разметке (кроме геометрии).
- По-прежнему нет списка `/demo/links` и кабинета с данными.
- Нет `pnpm test:e2e`, если его ещё не заводили.

## Проверки

```bash
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

Обнови `docs/implementation-status.md` (red и green).

## Git

Feature-ветка, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность токенов → `docs/frontend.md` / `docs/decisions.md`, не выдумывать палитру.
