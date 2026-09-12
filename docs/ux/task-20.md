# Реализуй задачу 20: summary list реквизитов

Пользователь написал «реализуй ux задачу 20». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

Родитель чата — диспетчер skill
[`.agents/skills/implement-review-cycle/SKILL.md`](../../.agents/skills/implement-review-cycle/SKILL.md):
код пишет `plan-item-implementer`, ревью — `plan-diff-reviewer`. Родитель код не
пишет. Отдельно писать «через implement → review» не нужно: фраза
`реализуй ux задачу N` уже включает цикл (D-042, D-047).

## Цель

Реквизиты читаются как пары «подпись | значение», не как ещё один абзац.
Сейчас `dl` столбец: 4px внутри пары и 8px между парами почти равны, «Изделие»
и его значение одного тона (это уже чинит задача 19). На desktop нужна сетка
GOV.UK Summary list / метаданных Stripe invoice, не карточки.

## Зависимости

Задача 19 в `main` (классы `.document-caption` / изделие ink уже есть). Фичи
15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-037, D-039, D-042, D-043, D-047, D-048)
- `docs/testing.md`
- `.agents/skills/implement-review-cycle/SKILL.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `apps/web/app/assets/css/main.css`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `apps/web/app/pages/r/[accessSecret]/d/[fileName].vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Один `<dl>` на кабинете (Заказчик / Изделие / Обновлено) и один
на листе (Заказчик / Изделие / Загружено / Размер). Не дробить на несколько
`dl`: e2e `dt` + `following-sibling::dd` и `main dl + p` («что дальше») должны
остаться истинными.

Завести в `main.css` класс **`.document-summary`** (имя фиксировано, D-048):

- ниже `40rem`: столбец, caption над значением; страница без горизонтального
  скролла (`scrollWidth <= 390` на 390×844);
- от `40rem` (`sm:`, тот же порог спеки): `display: grid`;
  `grid-template-columns: 9rem minmax(0, 1fr)`; `column-gap: 1rem`;
  `row-gap: 0.75rem`; `align-items: baseline`. Каждая пара `dt`+`dd` — одна
  строка (бок о бок, пересекаются по вертикали). Не требовать равенства
  `top`: после задачи 19 подпись 13px, значение 16px, при общей baseline
  tops расходятся ~3px;
- не сбрасывать user-agent `margin` у `dd` — Tailwind preflight уже
  `margin: 0`. Живые сдвиги пары — Vue `mt-*` на `dt`/`dd`; на desktop их
  убрать, чтобы grid-ряд не разъезжался.

Повесить класс на оба `dl`. Типографику задачи 19 не откатывать: `dt` —
`.document-caption`; `dd` заказчика и изделия — ink; дата и размер могут
остаться muted. Индекс `/` не трогать (там нет `dl`).

Ленту задачи 16, файлы задачи 15, спеку задач 17–18 не менять.

## Стек и границы

`main.css` + два `dl` кабинета/листа + e2e кабинета. Индекс, API — нет.

## TDD (red до CSS/Vue)

1. Playwright **до** правки, `make dev` + seed, `document.fonts.ready`:
   - кабинет З-10043, 1280×900: у `dl` `alignItems === 'baseline'`;
     `dt` `Заказчик` и `dd` `ИП Кузнецов П.А.` бок о бок (`dd.x >= dt.right - 2`)
     и пересекаются по вертикали (`dt.top < dd.bottom && dd.top < dt.bottom`);
     то же для `Изделие` / `ВРУ 400 А`. Не сравнивать `top`/`y` пары ≤ 2px;
   - лист КП, 1280×900: то же для `Заказчик` и для `Загружено` с его `time`;
   - кабинет и лист, 390×844: у каждой пары `dt.bottom <= dd.top` (столбец);
     `document.documentElement.scrollWidth <= 390`;
   - `main dl + p` на кабинете по-прежнему фраза «что дальше»;
   - computed `fontSize` `h1` кабинета остаётся `24px` (задача 19).
2. `pnpm test:e2e` — **red** на 1280px: сейчас `dd` ниже `dt`, вертикального
   пересечения нет. Если assert зелёный до CSS — он ловит `top`/`y` вместо
   пересечения, перепиши (после задачи 19 tops при baseline разойдутся ~3px).
3. Не `waitForTimeout`. Не `display: table` как второй язык рядом с grid.
   Не `align-items: start` «чтобы Y совпали».

## Что не делать

- Карточки на секцию, UI-kit, менять тексты, трогать ленту/файлы/спеку.
- Откатывать кегли задачи 19.
- Пушить в `main`.

## Критерии приёмки

- Given кабинет и лист З-10043 на 1280px, Then подпись и значение одной
  пары бок о бок с пересечением по вертикали (`align-items: baseline`).
  Равенство `top` не требуется.
- Given 390×844, Then пары столбцом, страница без горизонтального скролла.
- Given `.document-summary` в `main.css`, Then имя класса именно такое.
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

`pnpm generate:api` / `pnpm db:generate` не запускать. Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `fix/ux-document-summary-list`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Трек иерархии документа (задачи 19–20) на этом номере
закрыт. Фичи 15–27 — отдельно: `выполни задачу N` →
`docs/remediation-plan.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не оборачивай каждую пару в карточку.
