# Реализуй задачу 14: ссылки индекса видны в покое

Канон штампа после 2026-09-12 — D-045 (чернила на `--color-rule`, не
`bg-accent/15` из абзаца ниже). Этот промпт — исторический вход задачи 14;
не откатывать D-044/D-045.

Пользователь написал «реализуй ux задачу 14». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

Родитель чата — диспетчер skill
[`.agents/skills/implement-review-cycle/SKILL.md`](../../.agents/skills/implement-review-cycle/SKILL.md):
код пишет `plan-item-implementer`, ревью — `plan-diff-reviewer`. Родитель код не
пишет. Отдельно писать «через implement → review» не нужно: фраза
`реализуй ux задачу N` уже включает цикл (D-042).

## Цель

На служебном индексе номер заявки и title в покое выглядят как ссылки того же
языка, что имена файлов: класс `.document-link` (задача 13). Сейчас они
подчёркнуты `--color-rule` на креме — линия почти не видна, хотя
`docs/frontend.md` требует «номер и title выглядят как ссылка».

## Зависимости

Задача 13 в `main` (класс `.document-link` уже есть). Задачи 15–18 не начинать.
Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-023, D-027, D-034, D-040, D-042, D-043)
- `docs/testing.md`
- `.agents/skills/implement-review-cycle/SKILL.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `apps/web/app/assets/css/main.css`
- `apps/web/app/pages/index.vue`
- `e2e/demo-links.spec.ts`

## Контекст продукта

ПК «Нордщит». Индекс служебный. Фиксированные строки **не менять**:

- `Ссылки для показа`
- `Этот список не показывается заказчику.`
- `Так выглядит то, что вы отправили бы заказчику в мессенджер.`
- `Нажмите строку — откроется экран заказчика по ссылке.`

Класс `.document-link` не переименовывать и не дублировать вторым набором
правил. Повесить его на **номер** (`publicNumber`) и **title** внутри строки.
Обертку `NuxtLink` строки не делать целиком `.document-link`: иначе акцентом
станут контрагент и штамп.

Штамп `statusLabel` остаётся tag задачи 12: `bg-accent/15 text-accent`,
`font-normal` / weight 400, не `uppercase`, не `.document-link`. Клик по штампу
по-прежнему клик по строке. Тип ссылки не менять (D-034).

Контрагент может остаться muted без линии. Hover строки (`hover:text-accent` на
обёртке) не должен перебивать покой номера/title.

## Стек и границы

Только `index.vue` + e2e индекса. Кабинет, лист, `main.css` (кроме чтения
класса) не менять. Не переписывай `.document-link`.

## TDD (red до Vue)

1. Playwright `/` **до** правки, строка З-10043:
   - у текста `З-10043` и у текста `ВРУ 400 А` computed `color` ===
     `rgb(61, 90, 115)` и `textDecorationColor` === `rgb(61, 90, 115)`;
   - штамп `КП готово` **не** имеет `text-decoration-line: underline` и
     `font-weight` ≤ 400 (задача 12 жива);
   - четыре фиксированные строки индекса exact на месте;
   - строка — ссылка на `/r/seed-z10043-quote-kuznetsov`;
   - `getByRole('button')` = 0.
2. `pnpm test:e2e` — **red** (номер/title сейчас ink + линия rule).
3. Не ослабляй e2e задачи 12. Не `skip` клик З-10043.

## Что не делать

- Задачи 15–18, кабинет, новый CSS-класс.
- Копирайт индекса, кнопка «скопировать».
- Пушить в `main`.

## Критерии приёмки

- Given индекс без hover, Then номер и title строки — акцент + линия акцента.
- Given штамп, Then он tag, не ссылочный текст.
- Given D-027, Then четыре служебные фразы дословны.
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

Ветка `fix/ux-document-link-index`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «реализуй ux задачу 15» → `docs/ux/task-15.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не крась всю строку акцентом.
