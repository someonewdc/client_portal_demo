# Реализуй фичу 11: кабинет — файлы-записи + колонка комментария

## Цель

Файлы читаются как документы (тип, размер, дата), не как сломанные ссылки. Пустую колонку
«Комментарий» не держать. Скачивать нечего — кнопки нет (D-009).

## Зависимости

Фичи 1–10 в `main`. Фичу 12 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/domain-model.md` (files З-10043 / spec З-10042)
- `docs/decisions.md` (D-009, D-012, D-015, D-021, D-027)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie / `credentials: 'include'`
  **не применять** (D-015).
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret].vue`
- `apps/web/tests/async-data-problem.spec.ts` — стиль unit
- `apps/web/package.json` script `test`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Файлы — метаданные в seed, бинарников нет. Запрещено: `<a>` на файл,
`download`, чат, OTP, логин, mock-api.

Фиксированные строки и формат:

- `questionnaire` → `Опросный лист`
- `quote` → `КП`
- `invoice` → `Счёт`
- размер: `Math.round(byteSize / 1000) + ' КБ'` (`240000` → `240 КБ`, `98000` → `98 КБ`,
  `120400` → `120 КБ`)
- даты `uploadedAt` — тот же `Intl.DateTimeFormat` UTC, что на странице кабинета

## Стек и границы

- [`apps/web/app/pages/r/[accessSecret].vue`](../../apps/web/app/pages/r/[accessSecret].vue)
- новые [`apps/web/app/utils/request-file-display.ts`](../../apps/web/app/utils/request-file-display.ts)
  и [`apps/web/tests/request-file-display.spec.ts`](../../apps/web/tests/request-file-display.spec.ts)
- [`apps/web/package.json`](../../apps/web/package.json) `"test"` →
  `node --experimental-strip-types --test tests/*.spec.ts` (иначе новый spec не бежит)
- [`e2e/request-cabinet.spec.ts`](../../e2e/request-cabinet.spec.ts)
- Старые assert имён файлов не удалять. OpenAPI / seed не менять.

## TDD (два red, оба до UI)

1. Unit (`node --test`, стиль `apps/web/tests/async-data-problem.spec.ts`):
   `fileKindLabel('quote') === 'КП'`, `fileKindLabel('questionnaire') === 'Опросный лист'`,
   `fileKindLabel('invoice') === 'Счёт'`; неизвестный kind не маскировать пустой строкой
   (бросить или явный fallback — зафиксировать в тесте); `formatByteSize(240000)` даёт
   `240 КБ`, `formatByteSize(98000)` даёт `98 КБ`. Запуск
   `pnpm --filter @client-portal/web test` — **red**.
2. Playwright на З-10043: у `КП-З-10043.pdf` рядом видны `КП`, `240 КБ`,
   `time[datetime="2026-09-04T12:00:00.000Z"]`; у опросного листа — `Опросный лист`,
   `120 КБ`, `datetime="2026-09-01T09:05:00.000Z"`. Файл **не** `link` и не `[download]`.
   Кнопок 0. Второй кейс: `/r/seed-z10042-calc-portline` — в таблице спецификации **нет**
   заголовка `Комментарий` (у сида нет `comment`); на З-10043 заголовок `Комментарий` и
   текст `IP54, навесной` остаются. `pnpm test:e2e` против `make dev` + seed — **red**.
3. Реализация утилит, затем список файлов в Vue (имя + kind + размер + дата), колонка
   комментария только если `specLines.some((line) => line.comment)`.
4. Если прогон уже green до кода — перепиши assert. Не `skip`/`xit`. Не менять ISO
   «чтобы прошло».

## Что сделать

- Файлы как записи по D-027 / `docs/frontend.md`.
- Колонка комментария условная.

## Что не делать

- Фича 12. `<a>` / кнопка на файл. Upload, бинарники.
- Cookie forwarding, `credentials: 'include'` (D-015).
- Второй Nuxt на `:3000` (D-021).
- Пушить в `main`. Правка OpenAPI / seed.

## Критерии приёмки

- Given З-10043, Then файлы читаются как документы (тип, размер, дата), без affordance
  скачивания.
- Given З-10042, Then нет пустой колонки «Комментарий».
- Given D-009, Then нет мёртвого CTA.
- `pnpm test` подхватывает новый web spec.
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

Ветка `feat/cabinet-file-records`, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR. Фича 12 — отдельный чат по
`docs/llm/feature-12.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать. Если хочется кнопку
«скачать» — стоп, D-009.
