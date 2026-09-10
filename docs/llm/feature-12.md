# Реализуй фичу 12: индекс — заголовок и жест клика

## Цель

Ведущий сразу видит, что список служебный и что жест — клик по строке. Кабинет не трогать.

## Зависимости

Фичи 1–11 в `main`.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/demo-scenarios.md`
- `docs/decisions.md` (D-009, D-012, D-015, D-021, D-027)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie / `credentials: 'include'`
  **не применять** (D-015).
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/index.vue`
- `e2e/demo-links.spec.ts`

## Контекст продукта

ПК «Нордщит». Индекс только для показа, заказчик его не видит. Запрещено: кнопка
«скопировать», чат, OTP, каталог, mock-api.

Фиксированные строки (дисклеймер и мессенджер **не переформулировать**):

- заголовок: `Ссылки для показа`
- инструкция: `Нажмите строку — откроется экран заказчика по ссылке.`
- сохранить: `Этот список не показывается заказчику.`
- сохранить: `Так выглядит то, что вы отправили бы заказчику в мессенджер.`

## Стек и границы

- Только [`apps/web/app/pages/index.vue`](../../apps/web/app/pages/index.vue) и
  [`e2e/demo-links.spec.ts`](../../e2e/demo-links.spec.ts).
- Кабинет / OpenAPI / seed не менять.
- E2E против `make dev` + seed, без второго Nuxt (D-021).

## TDD (обязательно e2e до правки Vue)

1. **До Vue.** На `/` видны heading `Ссылки для показа`, инструкция `Нажмите строку —
откроется экран заказчика по ссылке.`, оба старых предложения; 5 ссылок с теми же
   `href`; клик З-10043 → `/r/seed-z10043-quote-kuznetsov`; `getByRole('button')` = 0;
   нет `href="#"`. `pnpm test:e2e` против `make dev` + seed — **red**.
2. Добавить `h2` + абзац инструкции; усилить видимость ссылки **внутри** существующего
   `<a>` (например подчеркнуть номер и title), не второй кнопкой.
3. Если сразу green — assert слишком слабый. Не `skip`/`xit`. Не переформулировать
   дисклеймер.

## Что сделать

- Заголовок и инструкция клика по D-027 / `docs/frontend.md`.

## Что не делать

- Кабинет. Кнопка «скопировать». Cookie / `credentials: 'include'` (D-015).
- Второй Nuxt на `:3000` (D-021).
- Пушить в `main`.

## Критерии приёмки

- Given индекс и `make dev` + seed, Then ведущий видит, что список служебный и что жест —
  клик по строке.
- When клик З-10043, Then URL `/r/seed-z10043-quote-kuznetsov` (тот же `portalPath`).
- Нет кнопки «скопировать», нет `href="#"`, нет `button`.
- Red evidence есть до green.

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

`pnpm generate:api` / `pnpm db:generate` не запускать «на всякий случай». Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `feat/index-demo-gesture`, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать.
