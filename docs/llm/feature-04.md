# Реализуй фичу 4: токены Tailwind и документный layout

## Цель

Зритель должен увидеть лист бумаги, а не серый каркас и не SaaS-дашборд. Этот шаг **впервые**
подключает Tailwind и фиксирует визуальный язык `docs/frontend.md` на уже существующем
`apps/web`. Данных заявок и e2e ещё нет.

## Зависимости

Фичи 1–3 в `main` (`apps/web`, `make dev` с web). Фич 5–8 нет. В F3 **нет** Tailwind —
если он уже стоит, это регресс границы D-020: сними и ставь здесь.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md` (таблица hex), `docs/decisions.md` (D-005, D-011, D-015, D-020)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — Tailwind-first от `@theme`. Часть про
  cookie / `credentials: 'include'` **не применять** (D-015; fetch — фича 6).
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web` из фичи 3

## Контекст продукта

ПК «Нордщит», русский документный UI. Запрещено: glassmorphism, нейрослоп, bento, неон,
3D, «AI dashboard», токены Вольтариса, каталог, mock-api.

## Стек и границы

- Здесь ставятся Tailwind v4, CSS-pipeline Nuxt (PostCSS / `@tailwindcss/vite` — тот путь,
  который сверят с официальными docs) и `@theme`. Патч — lockfile + docs в этом чате
  (D-011).
- Значения `@theme` — буквально из `docs/frontend.md`: `--color-paper: #f4f1ea`,
  `--color-sheet: #fffcf7`, `--color-ink: #1c1917`, `--color-ink-muted: #5c564e`,
  `--color-accent: #3d5a73`, `--color-rule: #d6d0c4`.
- Шрифт: `@fontsource/ibm-plex-sans` (кириллица), не Google Fonts CDN (D-015).
- Script `test:e2e` **не заводить**. Не тяни `GET /demo/links`.

## TDD

1. Targeted-тест, который **валится на каркасе F3**:
   - hex из `frontend.md` есть в CSS-файле, который **импортирован** из layout или
     `nuxt.config` (не «файл лежит в репо, но никуда не подключён»);
   - шапка «ПК «Нордщит»» рендерится **layout-компонентом** (не сырой строкой только в
     `pages/index`), колонка документа задана token/width из layout.
2. **Red**, потом стили.
3. Не зеленей от текста «Нордщит» на заглушке F3 и не от мёртвого CSS без import.

## Что сделать

- Подключить Tailwind v4 и `@theme` по `frontend.md`.
- Layout: бумага, IBM Plex, узкая колонка (~40–42rem), шапка в layout.
- `/` остаётся каркасом без фейковых статусов, но уже внутри этого layout.

## Что не делать

- Playwright / `pnpm test:e2e`.
- Список сидов, кабинет, Dockerfiles, `createApiClient`.
- Копировать `@theme` Вольтариса.
- Пушить в `main`.

## Критерии приёмки

- Layout: off-white `#f4f1ea`, один акцент `#3d5a73`, IBM Plex из
  `@fontsource/ibm-plex-sans`, нет neon/glass.
- Токены в `@theme` подключённого CSS; не россыпь arbitrary hex в разметке (кроме
  геометрии).
- Шапка живёт в layout, не только на индексной заглушке.
- Нет списка `/demo/links` и кабинета с данными.
- Корневого script `test:e2e` нет (не заводить).

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
