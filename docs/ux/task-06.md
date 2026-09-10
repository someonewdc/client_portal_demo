# Реализуй задачу 6: текущий шаг ленты (aria-current)

Пользователь написал «выполни ux задачу 6». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

## Цель

Лента 1–4 объявляет текущий шаг для вспомогательных технологий и отличает его от
пройденных и будущих без замены на wizard. Скринридер не слышит четыре одинаковых
пункта.

## Зависимости

Задача 5 в `main`. Задачи 7–12 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-007, D-012, D-015, D-027, D-038)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Лента остаётся `<ol aria-label="Этапы заявки">`. Не USWDS step-indicator
формы. Запрещено: канбан, прогресс-бар магазина.

Фиксировано:

- текущий `li`: `aria-current="step"`;
- внутри текущего штампа скрытый текст `сейчас` (`sr-only`);
- будущие по-прежнему `ещё нет`, без `time`;
- пройденные — `time` + классы ink без акцентной плашки;
- текущий — акцентная плашка, как сейчас.

## Стек и границы

Только разметка пунктов ленты в кабинете + e2e. Не переписывай шапку задачи 3.
Тип ссылок файлов не менять (D-034). Не чини 390px — это задача 7.

## TDD (red до Vue)

1. Playwright З-10043 **до** правки:
   - в списке `Этапы заявки` ровно один `[aria-current="step"]`;
   - этот пункт содержит `КП готово` и `сейчас`;
   - пункты «Принят» и «В расчёте» без `aria-current`;
   - «Счёт выставлен» содержит `ещё нет`, без `time`.
2. `pnpm test:e2e` — **red** (`aria-current` нет).
3. Повесь `aria-current` на `li` текущего `stage.status === request.status`.
   `сейчас` — `span.sr-only` (Tailwind), не видимый второй штамп.
4. Не `skip`. Не меняй подписи шагов.

## Что не делать

- Задачи 7–12, коннектор-«трубопровод», иконки галочек из UI-kit.
- Пушить в `main`.

## Критерии приёмки

- Given З-10043, Then текущий пункт ленты — `aria-current="step"` и скрытое «сейчас».
- Given задачи 3–5, Then шапка и фраза «что дальше» на месте.
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

Ветка `fix/ux-process-current`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни ux задачу 7» → `docs/ux/task-07.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не заменяй `<ol>` на горизонтальный stepper.
