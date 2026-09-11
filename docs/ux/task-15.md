# Реализуй задачу 15: общая сетка списка файлов

Пользователь написал «реализуй ux задачу 15». Этот файл — полный вход. Другой
контекст не нужен. Фраза без `ux` — не этот файл.

Родитель чата — диспетчер skill
[`.agents/skills/implement-review-cycle/SKILL.md`](../../.agents/skills/implement-review-cycle/SKILL.md):
код пишет `plan-item-implementer`, ревью — `plan-diff-reviewer`. Родитель код не
пишет. Отдельно писать «через implement → review» не нужно: фраза
`реализуй ux задачу N` уже включает цикл (D-042).

## Цель

В блоке «Файлы» тип, имя, размер и дата держат **одни и те же** колонки на всех
строках. Сейчас у каждого `li` свой `grid-template-columns` с `auto` под свою
подпись: «Опросный лист» (~104px) vs «КП» (~19px) — имена стартуют в разных X
(на З-10044 разница ~85px), длинное имя ломается, короткое нет.

## Зависимости

Задача 14 в `main`. Задачи 16–18 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`, `docs/domain-model.md`
- `docs/decisions.md` (D-009, D-029, D-034, D-038, D-039, D-042, D-043)
- `docs/testing.md`
- `.agents/skills/implement-review-cycle/SKILL.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Под «Файлы» фраза exact `Имя открывает выписку на экране.`
Кликабельно только имя (`.document-link` задачи 13 не снимать). Тип / размер /
дата — не ссылки. `fileName` сидов не менять.

Общая сетка (D-043), любой из двух приёмов:

- `ul` — CSS grid, каждый `li` = `display: contents`; или
- у **каждого** `li` один и тот же `grid-template-columns` (не `auto` под
  контент первой колонки).

Дорожки:

- ≥ `40rem`: четыре колонки `тип | имя | размер | дата`. Первая колонка
  вмещает «Опросный лист» без сжатия имени в другую стартовую X.
- `< 40rem`: две **общие** колонки; перенос после имени допустим, если все
  записи переносятся одинаково (ритм задачи 9 жив) **и** X имени совпадает,
  X даты совпадает.

Проверять на З-10044 (три типа: «Опросный лист», «КП», «Счёт») и не ломать
З-10043. Страница на 390px без горизонтального скролла. Не UI-kit, не карточки.

Тип ссылки не менять (D-034). Ленту и спеку не трогать (задачи 16–18).

## Стек и границы

Классы списка файлов в кабинете + e2e. Лист файла, индекс, CSS `.document-link`
— не менять.

## TDD (red до Vue)

1. Playwright **до** правки:
   - кабинет `/r/seed-z10044-invoice-teplitsy`, viewport 1280×900: у трёх
     ссылок имён `getBoundingClientRect().x` совпадают (разница ≤ 2px);
     computed `gridTemplateColumns` всех `li` списка «Файлы» идентичны;
   - тот же кабинет, 390×844: X имён совпадают (≤ 2px); X дат совпадают
     (≤ 2px); `document.documentElement.scrollWidth <= 390`;
   - кабинет З-10043: фраза про выписку exact; кликабельно только имя;
     ритм переноса задачи 9 (`expectFileRecordsShareOneRhythm` или эквивалент)
     не ослаблять.
2. `pnpm test:e2e` — **red** (сейчас шаблоны `103px 215px …` vs `19px 300px …`,
   имена на разных X). Не опирайся только на совпадение Y — оно уже green.
3. Не `waitForTimeout`. Не меняй ожидаемые `href`.

## Что не делать

- Задачи 16–18, лист, индекс, API / seed.
- `flex-wrap` без общих дорожек как единственное «решение».
- Пушить в `main`.

## Критерии приёмки

- Given З-10044 на 1280px, Then имена файлов в одной колонке.
- Given 390×844, Then имена в одной колонке, даты в одной колонке, нет
  горизонтального скролла.
- Given З-10043, Then клик имени и фраза задачи 9 живы.
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

Ветка `fix/ux-files-shared-grid`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «реализуй ux задачу 16» → `docs/ux/task-16.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не делай имя кнопкой «скачать».
