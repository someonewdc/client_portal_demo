# Реализуй задачу 8: спецификация на ширине 390px

Пользователь написал «выполни ux задачу 8». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

## Цель

Таблица спецификации на телефоне не обрезает «Комментарий» / «Кол-во». Каждая строка
читается с видимыми подписями колонок.

## Зависимости

Задача 7 в `main`. Задачи 9–12 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`, `docs/domain-model.md`
- `docs/decisions.md` (D-012, D-015, D-038)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Колонки: `Наименование`, `Кол-во`, `Ед.`, `Комментарий` (колонка
комментария только если у какой-то строки есть `comment` — как сейчас).

На ширине `< 40rem`: не широкая 4-колоночная сетка. Каждая `specLine` — блок, у
каждого значения видна подпись (`Наименование` / `Кол-во` / `Ед.` / `Комментарий`).
`thead` на узкой ширине скрыт (`sr-only` или `hidden`), на desktop таблица как сейчас.
Не карточки с тенью, не bento.

## Стек и границы

Разметка `<table>` кабинета + e2e. Ленту задачи 7 не ломать. API не менять.

## TDD (red до Vue)

1. Playwright З-10043, viewport 390×844, **до** правки:
   - видны `Вводно-распределительное устройство 400 А`, `IP54, навесной`,
     `Рубильник ввода`;
   - видны подписи `Наименование`, `Кол-во`, `Ед.`, `Комментарий` (не обрезанные:
     полный текст в accessibility snapshot / `toHaveText`);
   - `document.documentElement.scrollWidth <= 390` (нет горизонтального скролла
     страницы из-за таблицы).
2. Тот же сценарий на 1280px: таблица с `thead` и теми же ячейками, как в фиче 11.
3. `pnpm test:e2e` — **red** (на 390px «Комментарий» обрезан / scrollWidth > 390).
4. Не `skip` desktop asserts.

## Что не делать

- Задачи 9–12, лист файла, новые колонки (цены).
- `overflow-x: auto` как единственное «решение» без подписей в блоке.
- Пушить в `main`.

## Критерии приёмки

- Given 390×844 и З-10043, Then спека читается, заголовки колонок полные, страница
  не шире вьюпорта.
- Given 1280px, Then таблица фичи 11 жива.
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

Ветка `fix/ux-spec-narrow`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни ux задачу 9» → `docs/ux/task-09.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не включай колонку комментария, если у всех
строк `comment` пуст.
