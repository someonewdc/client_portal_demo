# Реализуй фичу 3: Nuxt-каркас + токены + Playwright harness

## Цель

Зрителю нужен лист бумаги, а не SaaS-дашборд. Этот шаг ставит `apps/web` с токенами
`docs/frontend.md` и **harness Playwright**, чтобы фичи 4–5 писали e2e до страниц. Списка
ссылок и кабинета ещё нет.

## Зависимости

Фичи 1 и 2 в `main` (`api-client`, seed, API). Фич 4–6 нет.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`, `docs/implementation-plan.md`
- `docs/frontend.md`, `docs/architecture.md`, `docs/decisions.md` (D-005, D-006, D-011, D-012)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `.agents/skills/foundation-package-conventions/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- корневой `package.json`, `Makefile`, `packages/eslint-config/index.mjs`
- `packages/api-client` (уже сгенерирован фичей 2)

## Контекст продукта

ПК «Нордщит», русский документный UI. Запрещено: каталог, glassmorphism, нейрослоп, bento,
неон, 3D, «AI dashboard», токены Вольтариса, mock-api, Pinia для server state.

## Стек и границы

- Nuxt 4, Tailwind v4 `@theme`, Vue 3. Патч-версии — официальные docs + lockfile, не
  угадывать из памяти.
- Server state: `useFetch` / `useAsyncData` + один facade над
  `createProblemAwareClient<Paths>`. Web не импортирует Prisma, Nest DTO, `apps/api`.
- Playwright: заведи корневой (или web) script, который в корне доступен как `pnpm test:e2e`.
  Имени ещё нет — заведи именно `test:e2e`.
- Расширь `make dev`: db + api + web. Origin web `http://localhost:3000`.

## TDD

Поведение экранов 4–5 здесь не реализовывать. Для harness:

1. Подключи Playwright так, чтобы `pnpm test:e2e` запускается и падает, если web не
   слушает — или держит один минимальный smoke «document title / layout содержит
   Нордщит», если уже рисуешь layout.
2. Если пишешь smoke по layout — сначала red, потом layout.
3. Не пиши e2e списка ссылок и кабинета (это фичи 4 и 5).

## Что сделать

- `apps/web` в pnpm workspace.
- Layout: бумага, IBM Plex Sans, токены из `frontend.md`, колонка документа, шапка
  «ПК «Нордщит»».
- Заглушка `/` без фейкового списка заявок: честный «каркас» или короткий служебный текст,
  не декоративные статусы без API.
- CORS уже на `WEB_ORIGIN`; Nuxt base API URL с `/api/v1`.
- `pnpm test:e2e` существует. Без `waitForTimeout`.

## Что не делать

- Страницу списка сидов и кабинет `/r/{secret}` (фичи 4–5).
- Каталог, UI-kit, Pinia catalog.
- Копировать `apps/web` Вольтариса.
- Пушить в `main`.

## Критерии приёмки

- `apps/web` собирается, `make dev` поднимает web на :3000 и api на :3001.
- Layout визуально: off-white, один акцент стали, IBM Plex Sans, нет neon/glass.
- Web не импортирует Prisma / `@client-portal/api` source.
- В корневом `package.json` есть `test:e2e` (или workspace script с таким именем, который
  `pnpm test:e2e` запускает).
- Нет маршрута кабинета с данными и нет списка из `/demo/links` (или есть только пустой
  каркас без притворных статусов).

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

`generate:api` / `db:generate` — только если трогал контракт/схему. Обнови
`docs/implementation-status.md`.

## Git

Feature-ветка, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Для layout-smoke — red и green, если
тест писали.

## Стоп

Неоднозначность контракта или версии Nuxt → `docs/decisions.md` + lockfile, не угадывать.
