# Реализуй задачу 3: текущий статус в шапке кабинета

Пользователь написал «выполни задачу 3». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Заказчик за первые секунды видит **текущий шаг**, а не только номер. Подпись
`Статус заявки` стоит над `stage.label` текущего статуса (это `h1`). Номер остаётся
крупным tabular, но не heading. Плашки статуса у даты по-прежнему нет. Штамп в ленте
остаётся — «КП готово» на З-10043 встречается больше одного раза.

## Зависимости

Задача 2 в `main`. Задачи 4–12 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`, `docs/domain-model.md`
- `docs/decisions.md` (D-007, D-012, D-015, D-027, D-037, D-040)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie **не** (D-015)
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Статусный документ. Запрещено: вторая плашка у даты, логин, скачать,
ссылка на `/`.

Фиксированные строки (не выдумывать другие статусы):

- `Статус заявки`
- `Менеджер отправил вам эту ссылку. Вход не нужен.`
- h1 З-10043 = `КП готово` (label из `stages`, где `status === request.status`)
- h1 З-10041 = `Принят`
- title кабинета: `{statusLabel} — {publicNumber} — ПК «Нордщит»`
  (пример: `КП готово — З-10043 — ПК «Нордщит»`)

Номер `З-10043` виден как текст с `tabular-nums`, не `heading`.

## Стек и границы

Только кабинет `index.vue` и `e2e/request-cabinet.spec.ts`. Лист файла, индекс `/`,
API не трогать. Тип ссылки файлов не менять (D-034).

## TDD (red до правки Vue)

1. **До Vue** заменить/добавить asserts в e2e (старые сценарии не `skip`):
   - З-10043: `heading` level 1 exact `КП готово`;
   - `getByText('З-10043', { exact: true })` виден, `heading` с именем `З-10043` = 0;
   - `getByText('КП готово', { exact: true })` ≥ 2 (шапка + лента);
   - рядом с `time[datetime="2026-09-04T12:00:00.000Z"]` даты обновления **нет**
     плашки статуса (как в D-027: не дублировать штамп у даты);
   - `document.title` содержит `КП готово — З-10043 — ПК «Нордщит»`;
   - фраза про менеджера и подпись `Статус заявки` на месте.
2. `pnpm test:e2e` — **red** (h1 всё ещё номер; title без статуса).
3. Минимальная вёрстка: eyebrow `Статус заявки`, h1 = текущий `stage.label`, номер
   ниже. `useSeoMeta` title по шаблону. Не добавляй плашку к дате.
4. Не меняй ISO дат «чтобы прошло».

## Что не делать

- Подписи «Заказчик» / «Изделие» (задача 4), «что дальше» (задача 5).
- Фичи 15–27, API, seed.
- Пушить в `main`.

## Критерии приёмки

- Given З-10043, Then зритель читает «КП готово» как главный заголовок листа до ленты.
- Given дата обновления, Then рядом с ней нет штампа статуса.
- Given лента, Then штамп текущего шага на месте.
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

Ветка `fix/ux-cabinet-status-header`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 4» → `docs/ux/task-04.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не убирай ленту 1–4.
