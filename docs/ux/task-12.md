# Реализуй задачу 12: штамп статуса на индексе не кнопка

Пользователь написал «выполни задачу 12». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

На служебном индексе штамп статуса выглядит как NHS/GOV.UK tag (прилагательное,
светлая плашка, не полужирная «кнопка»), хотя вся строка по-прежнему ссылка.
Дисклеймер и фразу про мессенджер не переписывать.

## Зависимости

Задача 11 в `main`. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-012, D-015, D-027, D-034, D-040)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/index.vue`
- `e2e/demo-links.spec.ts`

## Контекст продукта

ПК «Нордщит». Индекс служебный. Фиксированные строки **не менять**:

- `Ссылки для показа`
- `Этот список не показывается заказчику.`
- `Так выглядит то, что вы отправили бы заказчику в мессенджер.`
- `Нажмите строку — откроется экран заказчика по ссылке.`

Штамп: тот же `statusLabel`, классы плашки `bg-accent/15 text-accent`, но
`font-semibold` → `font-normal` (или эквивалент weight 400). Не `uppercase`.
Не вынимай штамп из `<a>`/`NuxtLink` строки (клик по штампу = клик по строке).
Тип ссылки не менять (D-034).

## Стек и границы

Только `index.vue` + e2e индекса. Кабинет не трогать: там штамп ленты может
остаться semibold (задача 6).

## TDD (red до Vue)

1. Playwright `/` **до** правки:
   - штамп `КП готово` в строке З-10043 имеет computed `font-weight` ≤ 400
     (не 600);
   - четыре фиксированные строки индекса на месте;
   - строка З-10043 всё ещё ссылка на `/r/seed-z10043-quote-kuznetsov`;
   - `getByRole('button')` = 0.
2. `pnpm test:e2e` — **red** (weight 600).
3. Не перекрашивай штамп в solid dark (GOV.UK как раз ушли от этого — похоже на
   кнопку).

## Что не делать

- Новые фичи 15–27, копирайт индекса, кнопка «скопировать».
- Пушить в `main`.

## Критерии приёмки

- Given индекс, Then штампы visually tags (нормальный вес), строки кликабельны.
- Given D-027, Then три служебные фразы дословны.
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

Обнови `docs/implementation-status.md` (red и green).

## Git

Ветка `fix/ux-index-status-stamp`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Трек `docs/ux/` на этом номере закрыт. Фичи 15–27 — отдельно:
`выполни задачу N` → `docs/remediation-plan.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не делай штамп отдельной кнопкой.
