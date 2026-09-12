# Реализуй задачу 18: колонка «Кол-во» на desktop не ломается

Пользователь написал «реализуй ux задачу 18». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

Родитель чата — диспетчер skill
[`.agents/skills/implement-review-cycle/SKILL.md`](../../.agents/skills/implement-review-cycle/SKILL.md):
код пишет `plan-item-implementer`, ревью — `plan-diff-reviewer`. Родитель код не
пишет. Отдельно писать «через implement → review» не нужно: фраза
`реализуй ux задачу N` уже включает цикл (D-042).

## Цель

В таблице спецификации кабинета на ≥ `40rem` заголовок «Кол-во» читается в одну
строку. Сейчас колонка ~63px без min-width: «Кол-» / «во» ломается, «Ед.» и
«Комментарий» сжаты. Это последний кусок внутренней сетки документа.

## Зависимости

Задача 17 в `main`. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-038, D-042, D-043)
- `docs/testing.md`
- `.agents/skills/implement-review-cycle/SKILL.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Desktop-таблица фичи 11 / задачи 8 сохраняется от `40rem`.
Колонки: `Наименование`, `Кол-во`, `Ед.`, `Комментарий` (последняя — только если
есть comment). Заголовок «Кол-во» — одна **текстовая** строка: `Range` по
текстовому узлу (или по внутреннему span с этим текстом) даёт
`getClientRects().length === 1`. Не считать `th.getClientRects()`,
`Range.selectNodeContents(th)` и не сравнивать высоту `th` с «Наименование» /
«Ед.»: у ячеек одной строки таблицы общая высота ряда, а `th` сам по себе —
один border box даже когда «Кол-» / «во» уже в две строки.

Допустимо: `min-width` / `whitespace-nowrap` на «Кол-во» и «Ед.»,
`table-layout`, доли колонок. Не `overflow-x: auto` как единственное решение.
На `< 40rem` блоки задачи 8 не ломать: страница без горизонтального скролла.

Ленту задачи 16 и файлы задачи 15 не трогать. Лист задачи 17 не трогать.
Тексты ячеек и состав сидов не менять.

## Стек и границы

`<table>` / `<th>` кабинета + e2e. Лист, индекс, API — нет.

## TDD (red до Vue)

1. Playwright кабинет З-10043, 1280×900, **до** правки:
   - `th` с текстом exact `Кол-во`: число line-box у **текста**, не у ячейки.
     Собрать текстовые узлы внутри `th` (`TreeWalker` / `firstChild`), на каждый
     непустой — `Range.selectNodeContents(textNode)` и сложить
     `range.getClientRects().length`. Ожидание: `=== 1`.
     Запрещены как red-доказательство: `th.getClientRects().length`,
     `Range.selectNodeContents(th)`, сравнение `offsetHeight` / `clientHeight` /
     `getBoundingClientRect().height` с «Наименование» или «Ед.»;
   - ячейки `1` / `шт` / `IP54, навесной` видны;
   - 390×844: подписи блоков задачи 8 и `scrollWidth <= 390` живы.
2. `pnpm test:e2e` — **red** на 1280px: сейчас «Кол-во» даёт **два** line-box
   (`Кол-` / `во`). Если assert зелёный до CSS — он ещё ловит box ячейки,
   перепиши.
3. Не ослабляй desktop `display: table-row` задачи 8.

## Что не делать

- Лист, лента, файлы, индекс, новые колонки (цены).
- UI-kit, тени карточек.
- Пушить в `main`.

## Критерии приёмки

- Given З-10043 на 1280px, Then «Кол-во» в одну строку, таблица читается.
- Given 390×844, Then спека задачи 8 зелёная.
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

Ветка `fix/ux-spec-qty-column`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Трек сетки и ссылок в покое (задачи 13–18) на этом номере
закрыт. Дальше: «реализуй ux задачу 19» → `docs/ux/task-19.md`. Фичи 15–27 —
отдельно: `выполни задачу N` → `docs/remediation-plan.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не включай колонку комментария, если у
всех строк `comment` пуст.
