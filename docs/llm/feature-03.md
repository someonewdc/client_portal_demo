# Реализуй фичу 3: Nuxt в workspace + `make dev` с web

## Цель

Появится место, куда ведущий откроет `http://localhost:3000`. Этот шаг только вставляет
`apps/web` в монорепо и в Makefile. Без CSS-pipeline, без Playwright, без списка ссылок и
кабинета.

## Зависимости

Фичи 1 и 2 в `main`. Фич 4–8 нет.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`, `docs/implementation-plan.md`
- `docs/architecture.md`, `docs/decisions.md` (D-006, D-011, D-013, D-015, D-016, D-020)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — только границы «web не импортирует
  Prisma / Nest / `apps/api`» и «не Pinia для server state». Часть skill про
  `useFetch` / cookie / `credentials: 'include'` **не применять**: первого fetch ещё нет
  (facade — фича 6, D-015).
- `.agents/skills/foundation-package-conventions/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- корневой `package.json`, `pnpm-workspace.yaml`, `Makefile`, `packages/eslint-config/index.mjs`

Не обязательно читать `packages/api-client` как работу этой фичи.

## Контекст продукта

ПК «Нордщит», канал статуса по ссылке, не витрина Вольтариса. Запрещено: каталог, mock-api,
чат, OTP, копирование `apps/web` Вольтариса, Pinia для server state.

## Стек и границы

- Nuxt 4, Vue 3. Патч-версии — официальные docs + lockfile в этом чате (D-011).
- **Не** ставить Tailwind, PostCSS, `@tailwindcss/vite`, `@nuxtjs/tailwindcss`, `@theme`,
  `@fontsource/*`. CSS-pipeline — фича 4.
- **Не** заводить `pnpm test:e2e` — фича 5.
- **Не** заводить facade `createApiClient` / вызовы generated client — фича 6.
- Web не импортирует Prisma, Nest DTO, `apps/api`.
- Расширь `make dev`: db + api + web на `:3000`. `make up` по-прежнему только Postgres
  (D-016).

## TDD

1. Targeted-тест **workspace**, не HTTP: `apps/web` есть в `pnpm-workspace.yaml` /
   корневом `typecheck` и `build`; `make dev` зависит от web (как
   `scripts/lifecycle-targets.spec.mjs` в фиче 1 проверяет текст целей).
2. **Red**, потом каркас.
3. Не пиши e2e, curl к `:3000` и Playwright. HTML на порту — smoke фичи 5.
4. Не рисуй список заявок и штампы без API.

## Что сделать

- `apps/web` в pnpm workspace, Nuxt слушает `:3000` (процесс есть; приёмка порта — не этот
  PR).
- Заглушка `/`: честный каркас (например имя завода текстом), не декоративные статусы.
- Можно завести `NUXT_PUBLIC_*` base URL с prefix `/api/v1` впрок — без fetch.
- Расширь `make dev`. Обнови корневой `typecheck`/`build`, если web не подхватывается.

## Что не делать

- Tailwind, PostCSS, Vite CSS plugin (`@tailwindcss/vite` и аналоги), `@theme`,
  `@fontsource/ibm-plex-sans`.
- Playwright, `createApiClient`, индекс `/demo/links`, кабинет `/r/{secret}`.
- Dockerfiles приложений (фича 8).
- Пушить в `main`.

## Критерии приёмки

- `apps/web` входит в `pnpm typecheck` и `pnpm build`.
- `make dev` в Makefile зависит от web (наряду с db+api). Grep/`lifecycle-targets` это
  ловит. Отдельный assert «curl :3000» не требуется.
- Нет Tailwind / PostCSS / `@tailwindcss/*` / `@nuxtjs/tailwindcss` в workspace
  dependencies.
- Нет `test:e2e` в корневом `package.json`.
- Нет списка из API, кабинета с данными и facade над `api-client`.
- Web не импортирует Prisma / `@client-portal/api` source.

## Проверки

```bash
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`test:e2e` нет — не выдумывай. Обнови `docs/implementation-status.md` (red и green).

## Git

Feature-ветка, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность версии Nuxt → `docs/decisions.md` + lockfile, не угадывать.
