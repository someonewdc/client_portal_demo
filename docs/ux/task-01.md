# Реализуй задачу 1: видимый клавиатурный фокус

Пользователь написал «выполни ux задачу 1». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

## Цель

Ссылки и остальные фокусируемые элементы показывают кольцо `:focus-visible`. Сейчас у
сфокусированной ссылки `outline-style: none` — клавиатура не видит, где фокус (WCAG 2.4.7).

## Зависимости

Этот набор `docs/ux/` в `main` (D-036, D-040). Задачи 2–12 не начинать. Фичи 15–27 не
реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`, `docs/decisions.md` (D-012, D-015, D-023, D-040)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/assets/css/main.css`
- `e2e/demo-links.spec.ts`, `e2e/layout-header.spec.ts` — стиль e2e

## Контекст продукта

ПК «Нордщит». Документный UI, токен `--color-accent: #3d5a73`. Запрещено: логин, OTP,
скачать, `#`, mock-api, UI-kit, неон.

## Стек и границы

- [`apps/web/app/assets/css/main.css`](../../apps/web/app/assets/css/main.css)
- новый тест в [`e2e/layout-header.spec.ts`](../../e2e/layout-header.spec.ts) или рядом
  в `e2e/`
- Vue, Nest, Prisma, OpenAPI, seed не менять.

## TDD (red до правки CSS)

1. **До CSS** Playwright на `/` против `make dev` + seed:
   - `Tab` до первой ссылки строки заявок;
   - элемент `:focus-visible` (или сфокусированная `a`) имеет
     `getComputedStyle` `outlineStyle !== 'none'` и `outlineWidth` ≥ `2px`.
   - Запуск `pnpm test:e2e` — **red** (сейчас outline none).
2. В `@layer base` добавь:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

Не ставь `outline: none` на `a` без замены. Не `:focus` на все клики мышью. 3. Если сразу green — assert слабый. Не `skip`/`xit`.

## Что не делать

- Задачи 2–12, фичи 15–27, `NuxtLink` (D-034).
- Cookie / `credentials: 'include'` (D-015).
- Пушить в `main`.

## Критерии приёмки

- Given индекс `/` и клавиша Tab, Then у сфокусированной ссылки видно кольцо акцента
  ≥ 2px.
- Given существующие e2e шапки и индекса, Then они зелёные без ослабления.
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

Ветка `fix/ux-focus-visible`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни ux задачу 2» → `docs/ux/task-02.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не менять копирайт экранов.
