# Реализуй задачу 2: иерархия заголовков и title индекса/404

Пользователь написал «выполни задачу 2». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Бренд в шапке перестаёт быть единственным `h1`. У каждой страницы один смысловой `h1`.
`document.title` индекса и тупика неизвестного секрета различаются. Скринридер и вкладка
больше не видят везде только «ПК „Нордщит“».

## Зависимости

Задача 1 в `main`. Задачи 3–12 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`, `docs/decisions.md` (D-012, D-015, D-023, D-040)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie **не** применять (D-015)
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/layouts/default.vue`
- `apps/web/app/pages/index.vue`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `apps/web/app/pages/r/[accessSecret]/d/[fileName].vue`
- `e2e/layout-header.spec.ts`, `e2e/demo-links.spec.ts`, `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Шапка остаётся видимой строкой бренда. Запрещено: ссылка шапки на `/`,
логин, скачать, mock-api.

Фиксированные строки:

- бренд шапки: `ПК «Нордщит»` (не heading)
- индекс `h1` + title: `Ссылки для показа` /
  `Ссылки для показа — ПК «Нордщит»`
- кабинет `h1` на этом шаге: номер заявки (как сейчас визуально `h2`)
- лист `h1`: `fileName` сида
- 404 `h1` + title: `Ссылка недействительна` /
  `Ссылка недействительна — ПК «Нордщит»`

## Стек и границы

Только layout, четыре страницы выше, затронутые e2e. API / Prisma / seed нет.
`useSeoMeta` на индексе и 404; default title в layout можно оставить fallback.
Существующий тип ссылки (`<a>` или `NuxtLink`) не менять (D-034).

## TDD (red до правки Vue)

1. **До Vue** поправить/добавить Playwright (не `skip` старые сценарии, заменить
   селектор шапки):
   - `/`: в `banner` виден текст `ПК «Нордщит»`, **нет**
     `banner` heading с этим именем;
   - `/`: `getByRole('heading', { level: 1, name: 'Ссылки для показа' })`;
   - `document.title` на `/` содержит `Ссылки для показа — ПК «Нордщит»`;
   - кабинет З-10043: `heading` level 1 = `З-10043`;
   - лист `КП-З-10043.pdf`: `heading` level 1 = это имя;
   - `/r/this-secret-does-not-exist`: `heading` level 1 = `Ссылка недействительна`;
     `document.title` содержит `Ссылка недействительна — ПК «Нордщит»`.
2. `pnpm test:e2e` — **red** (бренд всё ещё h1, title везде завод).
3. Layout: бренд — `<p>` (те же классы, что были у h1). Страницы: бывшие смысловые
   `h2` → `h1`. `useSeoMeta({ title })` на индексе и 404.
4. Не `skip`. Не оставлять страницу без `h1`.

## Что не делать

- Задачи 3–12 (статус в шапке, подписи, лист-выписка).
- Фичи 15–27, `NuxtLink`, cookie.
- Пушить в `main`.

## Критерии приёмки

- Given любая страница стенда, Then в banner бренд не heading, и ровно один `h1` —
  смысл экрана.
- Given `/` и битый секрет, Then `document.title` различает их.
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

Ветка `fix/ux-heading-hierarchy`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 3» → `docs/ux/task-03.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не делай бренд ссылкой на `/`.
