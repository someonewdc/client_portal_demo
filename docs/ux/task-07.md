# Реализуй задачу 7: лента этапов на ширине 390px

Пользователь написал «выполни задачу 7». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

На телефоне (как из мессенджера) счётчик, штамп и дата каждого шага читаются целиком.
Ничего не обрезается и не наезжает на соседний пункт.

## Зависимости

Задача 6 в `main`. Задачи 8–12 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-012, D-015, D-038)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Индекс говорит про мессенджер — 390px это основной носитель ссылки.
Запрещено: горизонтальный stepper, скрытие будущих шагов, bento.

## Стек и границы

Классы ленты в кабинете + e2e. Спецификацию не трогать (задача 8).
`aria-current` задачи 6 сохранить.

Приёмка вёрстки: ниже `40rem` пункт — колонка (`flex-col` / stack): первая строка
счётчик + штамп, вторая — дата или `ещё нет`. На desktop (≥ `40rem`) строка как сейчас
допустима. Только токены `@theme` / Tailwind, без произвольного UI-kit.

## TDD (red до Vue)

1. Новый Playwright на З-10043: `page.setViewportSize({ width: 390, height: 844 })`
   **до** правки:
   - все четыре пункта `Этапы заявки` видимы;
   - тексты `Принят`, `В расчёте`, `КП готово`, `Счёт выставлен`, `ещё нет` не
     обрезаны (`overflow` не clip по ширине пункта: `scrollWidth <= clientWidth + 1`
     у каждого `li`);
   - `aria-current="step"` по-прежнему один.
2. `pnpm test:e2e` — **red** (на 390px пункт шире контейнера / дата наезжает).
3. Не `waitForTimeout`. Не ослабляй desktop e2e задачи 6.

## Что не делать

- Задачу 8 (таблица спеки), файлы, API.
- `position: sticky` wizard.
- Пушить в `main`.

## Критерии приёмки

- Given 390×844 и З-10043, Then каждый шаг читается без горизонтального обрезания.
- Given 1280px, Then лента задачи 6 зелёная.
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

Ветка `fix/ux-process-narrow`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 8» → `docs/ux/task-08.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не прячь колонку «ещё нет».
