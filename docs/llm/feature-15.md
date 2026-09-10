# Реализуй задачу 1 / фичу 15: декодировать route param один раз

Пользователь написал «выполни задачу 1». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

`routeParamValue` не вызывает повторный `decodeURIComponent` на значении, которое Vue
Router уже декодировал. Имя файла с литеральной последовательностью `%2F` остаётся
собой, а не превращается в `/`.

## Зависимости

Фичи 1–14 в `main`. Фичи 16–27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-012, D-015, D-029, D-030)
- `docs/remediation-plan.md`
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/composables/useRequestPortal.ts`
- `apps/web/tests/request-file-display.spec.ts` — стиль unit
- `apps/web/package.json` script `test`

## Контекст продукта

ПК «Нордщит». Лист файла: `/r/{secret}/d/{fileName}`. В `href` — `encodeURIComponent`
(D-029). Vue Router декодирует сегмент один раз. Запрещено: PDF, upload, логин, mock-api,
NuxtLink (D-034), правка API/Prisma/seed.

## Стек и границы

- [`apps/web/app/composables/useRequestPortal.ts`](../../apps/web/app/composables/useRequestPortal.ts)
  — только `routeParamValue` (и экспорт, если тест импортирует его отсюда).
- Новый или существующий web unit: `apps/web/tests/` (`node --experimental-strip-types`).
- Страницы Vue, e2e, OpenAPI, Prisma не менять, кроме минимального импорта, если
  вынесешь хелпер в `app/utils/`. Предпочти не плодить файлы: правь функцию на месте.

## TDD (red до правки функции)

1. Unit `pnpm --filter @client-portal/web test`:
   - `routeParamValue('file%2Fname.pdf') === 'file%2Fname.pdf'` (не `'file/name.pdf'`);
   - `routeParamValue('КП-З-10043.pdf') === 'КП-З-10043.pdf'`;
   - массив `['a.pdf']` → `'a.pdf'`; `undefined` → `''`.
     Запуск — **red** (сейчас второй decode съест `%2F`).
2. Реализуй: верни сырое значение после выбора элемента массива. Не вызывай
   `decodeURIComponent`.
3. Если сразу green — assert слишком слабый. Не `skip`/`xit`.

## Что сделать

- Убрать повторный decode. Сохранить выбор первого элемента, если param — массив.

## Что не делать

- `watch` / computed-ключ `useAsyncData` (фича 16).
- `NuxtLink`, заголовки, API, Prisma, e2e.
- Cookie / `credentials: 'include'` (D-015).
- Пушить в `main`.

## Критерии приёмки

- Given param `file%2Fname.pdf`, Then функция возвращает его без превращения `%2F` в `/`.
- Given кириллическое имя сида, Then оно без изменений.
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
```

`pnpm generate:api` / `pnpm db:generate` не запускать «на всякий случай». Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `fix/route-param-decode-once`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 2» → `docs/llm/feature-16.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не чинить соседние дефекты из D-030.
