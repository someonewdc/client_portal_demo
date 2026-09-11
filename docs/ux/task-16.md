# Реализуй задачу 16: колонки ленты этапов на desktop

Пользователь написал «реализуй ux задачу 16». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

Родитель чата — диспетчер skill
[`.agents/skills/implement-review-cycle/SKILL.md`](../../.agents/skills/implement-review-cycle/SKILL.md):
код пишет `plan-item-implementer`, ревью — `plan-diff-reviewer`. Родитель код не
пишет. Отдельно писать «через implement → review» не нужно: фраза
`реализуй ux задачу N` уже включает цикл (D-042).

## Цель

На ширине ≥ `40rem` даты (и «ещё нет») ленты стоят в одной колонке. Сейчас пункт
— `flex-wrap`: дата едет за шириной штампа. На З-10044 старт даты «Принят» и
«Счёт выставлен» расходится примерно на 60px — лента выглядит лесенкой.

На `< 40rem` колонка задачи 7 обязана остаться: счётчик+штамп / дата или
`ещё нет`.

## Зависимости

Задача 15 в `main`. Задачи 17–18 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-027, D-038, D-042, D-043)
- `docs/testing.md`
- `.agents/skills/implement-review-cycle/SKILL.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Лента — `<ol aria-label="Этапы заявки">`, не wizard и не канбан
(D-038). Четыре шага. Текущий: `aria-current="step"` и `sr-only` «сейчас».
Будущие — `ещё нет`. Штамп текущего шага по-прежнему светлая плашка акцента.

От `40rem`: три общие колонки `счётчик | штамп | дата/ещё нет`. Одинаковый
`grid-template-columns` (или `display: contents` на `li` внутри grid `ol`).
X дат / «ещё нет» совпадают (≤ 2px). Референс — USWDS process list: счётчики
как штампы в одном ритме, не прогресс-бар.

Ниже `40rem` — не широкая трёхколоночная строка: колонка задачи 7
(`flexDirection === 'column'` или дата ниже штампа больше чем на 4px).

Файлы задачи 15 и спеку не трогать. Тексты штампов не менять.

## Стек и границы

Классы `<ol>` / `<li>` ленты + e2e. Список файлов, таблица спеки, индекс — нет.

## TDD (red до Vue)

1. Playwright **до** правки:
   - кабинет `/r/seed-z10044-invoice-teplitsy`, 1280×900: у четырёх пунктов
     `getBoundingClientRect().x` элемента `time` или текста `ещё нет`
     совпадают (≤ 2px); `aria-current="step"` ровно один (шаг «Счёт выставлен»);
   - кабинет З-10043, 390×844: у каждого `li` дата/`ещё нет` на следующей
     строке относительно штампа (задача 7); все четыре подписи шагов видны;
     `scrollWidth` пункта не больше `clientWidth + 1`;
   - `sr-only` «сейчас» у текущего шага на месте.
2. `pnpm test:e2e` — **red** на 1280px (даты на разных X из-за `flex-wrap`).
   Не вали тест 390px, который уже green.
3. Не `waitForTimeout`. Не горизонтальный stepper.

## Что не делать

- Задачи 17–18, файлы, индекс, API.
- Скрывать будущие шаги, `position: sticky` wizard.
- Пушить в `main`.

## Критерии приёмки

- Given З-10044 на 1280px, Then даты ленты в одной колонке.
- Given 390×844, Then лента задачи 7 зелёная.
- Given текущий шаг, Then `aria-current="step"` и «сейчас» живы.
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

Ветка `fix/ux-process-shared-columns`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «реализуй ux задачу 17» → `docs/ux/task-17.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не прячь колонку «ещё нет».
