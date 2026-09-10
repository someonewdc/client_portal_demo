# Реализуй фичу 13: кабинет — HTML-лист файла по клику на имя

## Цель

Имя файла в кабинете открывает HTML-лист по тому же секрету. Скачивать нечего — PDF и
кнопки «скачать» нет (D-009, D-028).

## Зависимости

Фичи 1–12 в `main`.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/domain-model.md` (files З-10043)
- `docs/decisions.md` (D-009, D-012, D-015, D-021, D-027, D-028)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie / `credentials: 'include'`
  **не применять** (D-015).
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret].vue` (переезд в `index.vue` вложенного маршрута)
- `apps/web/app/utils/request-file-display.ts`
- `apps/web/tests/request-file-display.spec.ts`
- `e2e/request-cabinet.spec.ts`
- `scripts/lifecycle-targets.spec.mjs` (путь кабинета)

## Контекст продукта

ПК «Нордщит». Файлы — метаданные в seed, бинарников нет. Запрещено: PDF, upload,
`download`, `href="#"`, кнопка «скачать», чат, OTP, логин, mock-api, ссылка на `/`.

Фиксированные строки:

- `questionnaire` → зачин `Исходные требования.`
- `quote` → зачин `Коммерческое предложение.`
- `invoice` → зачин `Счёт.`
- ссылка назад: `К заявке {publicNumber}`
- тупик: `Ссылка недействительна` (секрет или имя не из `files`)

Маршрут листа: `/r/{accessSecret}/d/{fileName}`. В `href` — `encodeURIComponent`.

## Стек и границы

- Кабинет: [`apps/web/app/pages/r/[accessSecret]/index.vue`](../../apps/web/app/pages/r/[accessSecret]/index.vue)
- Лист: [`apps/web/app/pages/r/[accessSecret]/d/[fileName].vue`](../../apps/web/app/pages/r/[accessSecret]/d/[fileName].vue)
- Composable загрузки заявки (тот же `useAsyncData` key `request-portal:${accessSecret}`)
- [`apps/web/app/utils/request-file-display.ts`](../../apps/web/app/utils/request-file-display.ts)
  и unit рядом
- [`e2e/request-cabinet.spec.ts`](../../e2e/request-cabinet.spec.ts)
- OpenAPI / seed / Prisma не менять.
- E2E против `make dev` + seed, без второго Nuxt (D-021).

## TDD (два red, оба до Vue)

1. Unit (`pnpm --filter @client-portal/web test`): `requestFileHref` для секрета
   `seed-z10043-quote-kuznetsov` и `КП-З-10043.pdf` даёт `/r/seed-z10043-quote-kuznetsov/d/`
   - `encodeURIComponent` имени; `fileSheetLead('quote') === 'Коммерческое предложение.'`,
     `fileSheetLead('questionnaire') === 'Исходные требования.'`,
     `fileSheetLead('invoice') === 'Счёт.'`; неизвестный kind — бросить, не пустая строка.
     Запуск — **red**.
2. Playwright на З-10043: имя `КП-З-10043.pdf` — `link` с `href` на лист; клик → heading
   имени, `КП`, `240 КБ`, `datetime="2026-09-04T12:00:00.000Z"`, зачин, обе строки спеки,
   ссылка `К заявке З-10043`; нет `[download]`, нет «скачать», кнопок 0. Клик «К заявке»
   → `/r/seed-z10043-quote-kuznetsov`. Живой секрет + чужое имя → HTTP 404 и тупик
   `Ссылка недействительна`. Старый assert «у файла 0 ссылок» заменить; метаданные
   записей и колонка комментария остаются. `pnpm test:e2e` против `make dev` + seed —
   **red**.
3. Реализация хелперов, перенос кабинета, страница листа, ссылка только на имя файла.
4. Если сразу green — assert слишком слабый. Не `skip`/`xit`.

## Что сделать

- HTML-лист по D-028 / `docs/frontend.md`.
- Кликабельно только имя файла.

## Что не делать

- PDF, upload, кнопка «скачать», `href="#"`.
- Cookie / `credentials: 'include'` (D-015).
- Второй Nuxt на `:3000` (D-021).
- Пушить в `main`. Правка OpenAPI / seed / Prisma.

## Критерии приёмки

- Given З-10043, Then имя КП — ссылка на HTML-лист с типом, размером, датой, зачином и
  спецификацией; «К заявке» возвращает в кабинет.
- Given живой секрет и имя не из `files`, Then тупик 404, не логин.
- Given D-009, Then нет мёртвого CTA скачивания.
- Red evidence (unit и e2e) есть до green.

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

Ветка `feat/cabinet-file-sheets`, PR в `main`, не пушить в `main`. Skill
`git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать. Если хочется PDF или
кнопку «скачать» — стоп, D-009 / D-028.
