# Реализуй задачу 19: шкала ролей документа

Пользователь написал «реализуй ux задачу 19». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

Родитель чата — диспетчер skill
[`.agents/skills/implement-review-cycle/SKILL.md`](../../.agents/skills/implement-review-cycle/SKILL.md):
код пишет `plan-item-implementer`, ревью — `plan-diff-reviewer`. Родитель код не
пишет. Отдельно писать «через implement → review» не нужно: фраза
`реализуй ux задачу N` уже включает цикл (D-042, D-047).

## Цель

Заголовок отлипает от абзаца кеглем и цветом, не рамкой. Сейчас на кабинете и
листе три кегля 14/16/20: `h1` и номер оба 20px, секции «Спецификация» /
«Файлы» — 16px как body, `dd` изделия — muted как подпись. Squint оставляет
штамп и ссылку; остальное — полотно.

## Зависимости

Задача 18 в `main`. Задачу 20 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-015, D-023, D-037, D-039, D-040, D-042, D-047, D-048)
- `docs/testing.md`
- `.agents/skills/implement-review-cycle/SKILL.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `apps/web/app/assets/css/main.css`
- `apps/web/app/layouts/default.vue`
- `apps/web/app/pages/index.vue`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `apps/web/app/pages/r/[accessSecret]/d/[fileName].vue`
- `e2e/request-cabinet.spec.ts`
- `e2e/demo-links.spec.ts`

## Контекст продукта

ПК «Нордщит». Документный UI, не UI-kit. Веса шрифта только 400 и 600 (D-023):
новые файлы 500/700 не подключать.

Завести в `apps/web/app/assets/css/main.css` классы **с этими именами**
(контракт D-048, как `.document-link`):

| Класс                | Кегль              | Вес | Цвет                | Ещё                                           |
| -------------------- | ------------------ | --- | ------------------- | --------------------------------------------- |
| `.document-display`  | `1.5rem` (24px)    | 600 | `--color-ink`       | смысловой `h1` страницы                       |
| `.document-identity` | `1.125rem` (18px)  | 400 | `--color-ink`       | `tabular-nums`; номер, не heading             |
| `.document-section`  | `1.125rem` (18px)  | 600 | `--color-ink`       | `margin-top: 2.5rem`; `margin-bottom: 0.5rem` |
| `.document-caption`  | `0.8125rem` (13px) | 400 | `--color-ink-muted` | `letter-spacing: 0.02em`; не ALL CAPS         |

Вычисленные цвета: ink `rgb(28, 25, 23)`; muted `rgb(92, 86, 78)`.

Повесить:

1. Кабинет: кикер `Статус заявки` — caption; `h1` статуса — display; `publicNumber` —
   identity; `dt` полей — caption; все `dd` (включая изделие и дату) — ink, не
   muted; caption таблицы `Спецификация` и `h2` `Файлы` — section. Ритм секции
   на классе, не дублировать `mt-8` на `<table>` / `h2`.
2. Лист: тип файла — caption; `h1` `fileName` — display; номер — identity;
   `dt` — caption; `dd` — ink; `Спецификация` — section.
3. Индекс и оба 404: смысловой `h1` — display. Бренд шапки `ПК «Нордщит»` классом
   не красить (D-040).
4. Кластер идентичности (Vue): кикер→display `0.25rem`, display→номер `0.5rem`,
   номер→дисклеймер `1rem`.

Body (дисклеймер, «что дальше», подсказка файлов, зачин листа) остаётся
`1rem` / 400 / ink. Тексты D-046 не переписывать.

Двухколоночный `dl` — задача 20: здесь столбец как сейчас.

## Стек и границы

`main.css` + layout не трогать кроме того, что бренд не display. Vue индекса,
кабинета, листа + e2e кабинета и индекса. Лента, сетка файлов, колонки спеки,
`.document-link`, `.status-stamp`, Nest, Prisma, seed — нет.

## TDD (red до CSS/Vue)

1. Playwright **до** правки, `make dev` + seed, `document.fonts.ready`:
   - кабинет `/r/seed-z10043-quote-kuznetsov`:
     `h1` `КП готово` — `getComputedStyle` `fontSize === '24px'` и
     `fontWeight === '600'`;
     номер `З-10043` (не heading) — `fontSize === '18px'`;
     `h2` `Файлы` и caption `Спецификация` — `fontSize === '18px'`,
     `fontWeight === '600'`;
     `dt` `Заказчик` — `fontSize === '13px'`, `color === 'rgb(92, 86, 78)'`;
     `dd` изделия `ВРУ 400 А` — `color === 'rgb(28, 25, 23)'` (сейчас muted);
   - лист `/r/seed-z10043-quote-kuznetsov/d/КП-З-10043.pdf`: `h1` имени —
     `24px` / `600`; номер — `18px`;
   - индекс `/`: `h1` `Ссылки для показа` — `24px` / `600`;
   - 404 `/r/нет-такого-секрета`: `h1` `Ссылка недействительна` — `24px` / `600`;
   - имена классов `.document-display` / `.document-identity` /
     `.document-section` / `.document-caption` есть в `main.css`;
   - `h1` по-прежнему один на страницу; номер не heading; подписи полей,
     «что дальше», `.document-link` и штамп не сломаны (сценарии задач 3–6,
     13, 18 не `skip`).
2. `pnpm test:e2e` — **red**: сейчас `h1` кабинета `20px` (`text-xl`), номер
   кабинета `20px`, секции `16px`, изделие `rgb(92, 86, 78)`. Если assert
   зелёный до CSS — он ещё ловит текущие 20px, перепиши.
3. Не `waitForTimeout`. Не тестируй только наличие className без computed
   size/color.

## Что не делать

- Задачу 20, двухколоночный `dl`, карточки секций, капс, вторую гарнитуру.
- Ленту, файловую сетку, «Кол-во», API.
- Пушить в `main`.

## Критерии приёмки

- Given кабинет З-10043, Then статус 24px/600, номер 18px, секции 18px/600,
  подписи 13px muted, значения ink.
- Given лист КП, индекс и 404, Then смысловой `h1` тоже 24px/600.
- Given `.document-*` в `main.css`, Then имена классов буквально как в таблице.
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

Ветка `fix/ux-document-type-roles`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «реализуй ux задачу 20» → `docs/ux/task-20.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не делай hero-статус крупнее 24px.
