# Реализуй задачу 13: ссылки кабинета и листа видны в покое

Пользователь написал «реализуй ux задачу 13». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

Родитель чата — диспетчер skill
[`.agents/skills/implement-review-cycle/SKILL.md`](../../.agents/skills/implement-review-cycle/SKILL.md):
код пишет `plan-item-implementer`, ревью — `plan-diff-reviewer`. Родитель код не
пишет. Отдельно писать «через implement → review» не нужно: фраза
`реализуй ux задачу N` уже включает цикл (D-042).

## Цель

Имя файла в кабинете и «К заявке {publicNumber}» на листе и на 404 чужого файла
в **покое** читаются как ссылки: цвет акцента и линия акцента. Сейчас текст ink,
линия `--color-rule` (#d6d0c4) на листе (#fffcf7) почти не видна (контраст ~1.5:1).
Акцент только на `:hover` — без мыши жест не ясен.

## Зависимости

Задача 12 в `main`. Задачи 14–18 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-009, D-015, D-023, D-029, D-034, D-039, D-040, D-042, D-043)
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

ПК «Нордщит». Документный UI, не UI-kit. Токены уже в `@theme`:
`--color-accent: #3d5a73` → computed `rgb(61, 90, 115)`;
`--color-ink: #1c1917`; `--color-rule: #d6d0c4`.

Завести в `apps/web/app/assets/css/main.css` класс **`.document-link`**
(имя фиксировано, задача 14 его переиспользует):

- в покое: `color` и `text-decoration-color` = `var(--color-accent)`;
  `text-decoration-line: underline`; `text-underline-offset: 2px`;
- `:hover` может уходить в `--color-ink` (линия тоже ink); нельзя оставлять
  покой как ink + `--color-rule`;
- `:focus-visible` из D-040 не ослаблять.

Повесить класс на:

1. `NuxtLink` имени файла в кабинете (кликабельно только имя, D-029 / D-039);
2. `NuxtLink` «К заявке {publicNumber}» на живом листе;
3. тот же «К заявке» на 404 «файл не из заявки».

Тип ссылки не менять (D-034): не добавляй и не убирай `NuxtLink`. Индекс `/`
не трогать (задача 14). Сетку файлов и ленту не трогать (задачи 15–16).
Тексты дисклеймера, зачина и 404 не переписывать.

На тупике неизвестного секрета ссылки «К заявке» нет — не добавляй.

## Стек и границы

`main.css` + два Vue кабинета/листа + e2e кабинета. Nest, Prisma, OpenAPI, seed,
`index.vue` индекса — нет.

## TDD (red до CSS/Vue)

1. Playwright **до** правки, `make dev` + seed:
   - кабинет `/r/seed-z10043-quote-kuznetsov`: у ссылки `КП-З-10043.pdf`
     `getComputedStyle` `color` === `rgb(61, 90, 115)` и
     `textDecorationColor` === `rgb(61, 90, 115)`;
   - лист `/r/seed-z10043-quote-kuznetsov/d/КП-З-10043.pdf`: то же у
     `getByRole('link', { name: 'К заявке З-10043' })`;
   - 404 `/r/seed-z10043-quote-kuznetsov/d/нет-такого.pdf`: то же у
     «К заявке З-10043»;
   - клик имени и возврат «К заявке» по-прежнему открывают лист / кабинет
     (сценарии фичи 13 / задачи 10–11 не `skip`);
   - `getByRole('link', { name: /скачать/i })` = 0; `[download]` = 0.
2. `pnpm test:e2e` — **red** (сейчас color ink `rgb(28, 25, 23)`, линия
   `rgb(214, 208, 196)`).
3. Не тестируй только `:hover`. Не `waitForTimeout`.

## Что не делать

- Задачи 14–18, индекс, штамп ленты, API.
- Новые компоненты / UI-kit / кнопку «скачать».
- Пушить в `main`.

## Критерии приёмки

- Given кабинет З-10043 без hover, Then имя файла — ссылка цвета акцента с
  линией акцента.
- Given лист КП и 404 чужого имени, Then «К заявке З-10043» в том же стиле.
- Given `.document-link` в `main.css`, Then имя класса именно такое.
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

Ветка `fix/ux-document-link-cabinet`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «реализуй ux задачу 14» → `docs/ux/task-14.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не крась штамп и тип файла как ссылку.
