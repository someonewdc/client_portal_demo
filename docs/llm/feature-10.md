# Реализуй фичу 10: кабинет — рамка документа + лента процесса

## Цель

Кабинет сам объясняется: это статус заявки по ссылке без входа; лента 1–4 показывает, где
заявка и что ещё нет. Не тулбар и не кнопка «скачать».

## Зависимости

Фичи 1–9 в `main` (D-027 и этот промпт уже в репозитории). Фичи 11–12 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/demo-scenarios.md`, `docs/acceptance-checklist.md`
- `docs/domain-model.md` (даты `reachedAt` сида З-10043)
- `docs/decisions.md` (D-007, D-009, D-012, D-015, D-021, D-027)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie / `credentials: 'include'`
  **не применять** (D-015).
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret].vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Кабинет снаружи по секрету. Статусный документ, не панель. Запрещено: чат,
OTP, логин, скачать, `#`, mock-api, ссылка на индекс `/`.

Фиксированные строки:

- `Статус заявки`
- `Менеджер отправил вам эту ссылку. Вход не нужен.`
- будущий шаг: `ещё нет`

Даты — тот же `Intl.DateTimeFormat('ru-RU', { day: 'numeric', hour: '2-digit', minute:
'2-digit', month: 'long', timeZone: 'UTC', year: 'numeric' })`, что уже на странице.

## Стек и границы

- Только [`apps/web/app/pages/r/[accessSecret].vue`](../../apps/web/app/pages/r/[accessSecret].vue)
  и [`e2e/request-cabinet.spec.ts`](../../e2e/request-cabinet.spec.ts).
- Существующие тесты фичи 7 не `skip` и не ослаблять. 404 не трогать.
- OpenAPI / Prisma / seed не менять. `pnpm generate:api` не нужен.
- E2E против `make dev` + seed, без второго Nuxt на `:3000` (D-021).

## TDD (обязательно e2e до правки Vue)

1. **До правки Vue** добавить Playwright (новый `test`, не замена старых) на fixture
   З-10043 `/r/seed-z10043-quote-kuznetsov`:
   - виден текст `Статус заявки`;
   - виден текст `Менеджер отправил вам эту ссылку. Вход не нужен.`;
   - `getByRole('heading', { name: 'З-10043' })` по-прежнему есть;
   - список `aria-label="Этапы заявки"`: 4 `listitem`; в них видимые счётчики `1`…`4` и
     подписи Принят / В расчёте / КП готово / Счёт выставлен;
   - у «Принят» `time[datetime="2026-09-01T09:00:00.000Z"]`; у «В расчёте»
     `2026-09-02T11:00:00.000Z`; у «КП готово» `2026-09-04T12:00:00.000Z`;
   - пункт «Счёт выставлен» содержит `ещё нет` и **не** содержит `time`;
   - `getByText('КП готово', { exact: true })` — **ровно 1** (штамп только в ленте);
   - `time[datetime="2026-09-04T12:00:00.000Z"]` даты обновления остаётся;
   - `getByRole('button')` = 0; нет `a[href="#"]`.
2. `pnpm test:e2e` против живого `make dev` + seed — **red** (нет заголовка / дат шагов /
   «ещё нет» / count ≠ 1). Зафиксировать команду, exit ≠ 0, причину в
   `docs/implementation-status.md`. Если сразу green — assert слишком слабый, переписать.
   Не мокать API. Не стартовать второй Nuxt (D-021).
3. Минимальная вёрстка в том же Vue: подпись + фраза; убрать плашку `statusLabel` рядом с
   датой; в `ol` — номер шага, `stage.label`, `time` из `stage.reachedAt` либо `ещё нет`.
   Классы штампов оставить: текущий акцент, пройденный ink, будущий muted (`stampClass`).
4. Не помечай фичу «готовой», если e2e написан после вёрстки под уже видимый DOM.
   Не менять ожидаемые ISO «чтобы прошло». Не `skip`/`xit`.

## Что сделать

- Рамка документа и лента процесса по `docs/frontend.md` и D-027.
- Данные `stages[].reachedAt` уже в payload; не выдумывать даты.

## Что не делать

- Фичи 11–12 (файлы-записи, индекс).
- Upload, оплата, чат, OTP, кнопка скачать, `#`, ссылка на `/`.
- Cookie forwarding, `credentials: 'include'` (D-015).
- Второй Nuxt на `:3000` (D-021).
- Пушить в `main`. Правка OpenAPI / seed.

## Критерии приёмки

- Given З-10043 и стенд `make dev` + seed, When открыть
  `/r/seed-z10043-quote-kuznetsov`, Then зритель видит, что это статус по ссылке без входа,
  и ленту 1–4 с датами до «КП готово» и «ещё нет» на счёте.
- Given тот же экран, Then текущий статус не дублируется у даты (`КП готово` ровно один
  раз).
- Given фича 7, Then номер, контрагент, title, спека, имена файлов, 404 — как раньше.
- Red evidence есть до green. Нет мёртвых кнопок.

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

`pnpm generate:api` / `pnpm db:generate` не запускать «на всякий случай». Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `feat/cabinet-status-document`, PR в `main`, не пушить в `main`. Skill
`git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR. Фича 11 — отдельный чат по
`docs/llm/feature-11.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать. Если хочется кнопку
«скачать» или правку OpenAPI — стоп, D-027 / D-009.
