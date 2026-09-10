# Реализуй задачу 10: лист файла как выписка

Пользователь написал «выполни ux задачу 10». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

## Цель

HTML-лист выглядит как выписка заявки, а не как пустой абзац под именем `.pdf`.
Полные строки спецификации (имя, количество, единица, комментарий если есть),
подписи полей, честный дисклеймер. Скачивать нечего.

## Зависимости

Задача 9 в `main`. Задачи 11–12 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`, `docs/domain-model.md`
- `docs/decisions.md` (D-009, D-012, D-015, D-029, D-034, D-037, D-039)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/d/[fileName].vue`
- `apps/web/app/utils/request-file-display.ts`
- `e2e/request-cabinet.spec.ts`
- `apps/web/tests/request-file-display.spec.ts`

## Контекст продукта

ПК «Нордщит». Зачины D-029 не менять:

- `questionnaire` → `Исходные требования.`
- `quote` → `Коммерческое предложение.`
- `invoice` → `Счёт.`

Фиксированные добавки:

- дисклеймер: `Это выписка на экране, не файл для скачивания.`
- подписи: `Заказчик`, `Изделие`, `Загружено`, `Размер`
- title вкладки: `{kindLabel} — {publicNumber} — ПК «Нордщит»`
  (КП З-10043: `КП — З-10043 — ПК «Нордщит»`)

`h1` после задачи 2 — `fileName`. Не делай h1 из зачина.
`К заявке {publicNumber}` остаётся. Тип ссылки не менять (D-034).

Спека на листе: для каждой `specLine` видны `name`, `quantity`, `unit` и `comment`,
если он не пустой. Не только `name`.

## Стек и границы

Страница листа, при необходимости formatter tests, e2e листа. Кабинет не менять,
кроме если e2e клика нужно ослабить селектор title — не ослабляй клик.
API / seed нет.

## TDD (red до Vue)

1. Playwright лист `/r/seed-z10043-quote-kuznetsov/d/КП-З-10043.pdf` **до** правки:
   - виден дисклеймер exact;
   - виден зачин `Коммерческое предложение.`;
   - видны `Заказчик` + `ИП Кузнецов П.А.`, `Изделие` + `ВРУ 400 А`;
   - видны `Загружено` и `Размер` + `240 КБ`;
   - видны количество `1` и `шт` у «Вводно-распределительное устройство 400 А»;
   - виден `IP54, навесной`;
   - `document.title` содержит `КП — З-10043 — ПК «Нордщит»`;
   - нет `скачать`, `[download]`, `href="#"`.
2. `pnpm test:e2e` — **red** (дисклеймера и qty нет).
3. Не меняй `fileSheetLead`. Не рендери PDF.

## Что не делать

- Задачи 11–12 (тексты 404).
- Upload, бинарник, фичи 15–27.
- Пушить в `main`.

## Критерии приёмки

- Given лист КП З-10043, Then это подписанная выписка с полной спекой и дисклеймером.
- Given «К заявке З-10043», Then возврат в кабинет жив.
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

Ветка `fix/ux-file-sheet-extract`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни ux задачу 11» → `docs/ux/task-11.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не обещай скачивание.
