# Реализуй фичу 3: Nuxt в workspace + `make dev` с web

## Цель

Появится место, куда ведущий откроет `http://localhost:3000`. Этот шаг только вставляет
`apps/web` в монорепо и в Makefile. Без токенов `frontend.md`, без Playwright, без списка
ссылок и кабинета.

## Зависимости

Фичи 1 и 2 в `main`. Фич 4–8 нет.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`, `docs/implementation-plan.md`
- `docs/architecture.md`, `docs/decisions.md` (D-006, D-011, D-013, D-015, D-016, D-020)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `.agents/skills/foundation-package-conventions/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- корневой `package.json`, `pnpm-workspace.yaml`, `Makefile`, `packages/eslint-config/index.mjs`
- `packages/api-client`

## Контекст продукта

ПК «Нордщит», канал статуса по ссылке, не витрина Вольтариса. Запрещено: каталог, mock-api,
чат, OTP, копирование `apps/web` Вольтариса, Pinia для server state.

## Стек и границы

- Nuxt 4, Vue 3. Патч-версии — официальные docs + lockfile в этом чате (D-011).
- Tailwind `@theme` и IBM Plex — **фича 4**, не здесь.
- `pnpm test:e2e` — **фича 5**, не заводи.
- Один facade над `createProblemAwareClient<Paths>` из generated client (можно ещё не
  вызывать с страницы). Cookie не форвардить; `credentials: 'include'` не ставить (D-015).
- Web не импортирует Prisma, Nest DTO, `apps/api`.
- Расширь `make dev`: db + api + web на `:3000`. `make up` по-прежнему только Postgres
  (D-016).

## TDD

1. Тест жизненного цикла / workspace: `make dev` (или документированная цель) поднимает
   процесс, который отвечает на `:3000`; корневой `typecheck`/`build` видит `apps/web`.
   Можно targeted-тест Makefile/scripts, как в фиче 1.
2. **Red**, потом каркас.
3. Не пиши e2e. Не рисуй список заявок и штампы без API.

## Что сделать

- `apps/web` в pnpm workspace, Nuxt слушает `:3000`.
- Заглушка `/`: честный каркас (например имя завода текстом), не декоративные статусы.
- `NUXT`/`API` base URL с prefix `/api/v1`.
- Расширь `make dev`. Обнови корневой `typecheck`/`build`, если web не подхватывается.

## Что не делать

- `@theme`, `@fontsource/ibm-plex-sans`, Playwright, индекс `/demo/links`, кабинет
  `/r/{secret}`.
- Dockerfiles приложений (фича 8).
- Пушить в `main`.

## Критерии приёмки

- Given `make dev`, When открыть `http://localhost:3000`, Then отвечает HTML-каркас, не
  ошибка порта.
- `apps/web` входит в `pnpm typecheck` и `pnpm build`.
- Нет `test:e2e` в корневом `package.json` (ещё не заводили).
- Нет списка из API и нет кабинета с данными.
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
