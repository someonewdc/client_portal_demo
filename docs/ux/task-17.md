# Реализуй задачу 17: спека на листе как в кабинете

Пользователь написал «реализуй ux задачу 17». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

Родитель чата — диспетчер skill
[`.agents/skills/implement-review-cycle/SKILL.md`](../../.agents/skills/implement-review-cycle/SKILL.md):
код пишет `plan-item-implementer`, ревью — `plan-diff-reviewer`. Родитель код не
пишет. Отдельно писать «через implement → review» не нужно: фраза
`реализуй ux задачу N` уже включает цикл (D-042).

## Цель

На HTML-листе файла спецификация использует ту же схему, что кабинет: таблица
от `40rem`, подписанные блоки ниже `40rem`. Сейчас лист рисует `span` + `ml-3`
в одну строку: количество «ВРУ …» стартует около X=697, «Рубильник ввода» —
около X=472. Это третья вёрстка тех же данных.

## Зависимости

Задача 16 в `main`. Задачу 18 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`, `docs/domain-model.md`
- `docs/decisions.md` (D-009, D-029, D-034, D-038, D-039, D-042, D-043)
- `docs/testing.md`
- `.agents/skills/implement-review-cycle/SKILL.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/d/[fileName].vue`
- `apps/web/app/pages/r/[accessSecret]/index.vue` — только как образец спеки,
  не править
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Лист остаётся выпиской (D-039). Не менять:

- дисклеймер `Это выписка на экране, не файл для скачивания.`;
- зачины D-029 (`Исходные требования.` / `Коммерческое предложение.` / `Счёт.`);
- подписи `Заказчик` / `Изделие` / `Загружено` / `Размер`;
- `h1` = `fileName`; title `{kindLabel} — {publicNumber} — ПК «Нордщит»`;
- ссылку `К заявке {publicNumber}` (класс `.document-link` задачи 13 сохранить);
- HTTP 404 и тексты тупиков задачи 11.

Колонки спеки как в кабинете: `Наименование`, `Кол-во`, `Ед.`, `Комментарий`
(колонка комментария только если у какой-то строки есть `comment`). На
`< 40rem` — блоки с видимыми подписями, `thead` скрыт, страница без
горизонтального скролла. От `40rem` — `<table>`, количества в одной колонке
(X ячеек qty совпадают, ≤ 2px). Не `inline` + `margin-left`. Не bento.

Если e2e листа считает `getByRole('listitem')` строки спеки — обнови селектор
на таблицу/блоки **в этом же PR**. Не ослабляй видимость qty / unit / comment
и клик «К заявке». Тип ссылки не менять (D-034). Кабинет не править (задача 18).

## Стек и границы

Страница листа + e2e листа. Кабинет, индекс, seed — нет.

## TDD (red до Vue)

1. Playwright лист `/r/seed-z10043-quote-kuznetsov/d/КП-З-10043.pdf` **до**
   правки:
   - 1280×900: у «1» рядом с «Вводно-распределительное устройство 400 А» и у
     «1» рядом с «Рубильник ввода» `getBoundingClientRect().x` совпадают
     (≤ 2px); видны `шт` и `IP54, навесной`;
   - 390×844: видны подписи `Наименование`, `Кол-во`, `Ед.`, `Комментарий`
     (exact / полный текст); `document.documentElement.scrollWidth <= 390`;
   - дисклеймер, зачин, «К заявке З-10043», title — как в задаче 10;
   - нет `скачать`, `[download]`, `href="#"`.
2. `pnpm test:e2e` — **red** на 1280px (qty на разных X) и/или на 390px (нет
   подписей колонок). Не делай assert, который green на текущих `ml-3`.
3. Не рендери PDF. Не `skip` клик «К заявке».

## Что не делать

- Задачу 18, кабинет, индекс, API / seed.
- Кнопку «скачать», новую колонку цен.
- Пушить в `main`.

## Критерии приёмки

- Given лист КП З-10043 на 1280px, Then спека — таблица с общей колонкой qty.
- Given 390×844, Then спека — подписанные блоки, страница не шире вьюпорта.
- Given «К заявке З-10043», Then возврат в кабинет и стиль задачи 13 живы.
- Red evidence есть до green.

## Проверки

```bash
pnpm --filter @client-portal/web test
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

Ветка `fix/ux-file-sheet-spec-grid`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «реализуй ux задачу 18» → `docs/ux/task-18.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не обещай скачивание.
