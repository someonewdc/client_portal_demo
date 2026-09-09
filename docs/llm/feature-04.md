# Реализуй фичу 4: экран списка демо-ссылок

## Цель

Ведущий за 10 секунд открывает «то, что отправили бы в мессенджер» и кликом входит в кабинет.
Заказчик этот список не видит — это надо написать на странице явно.

## Зависимости

Фичи 1–3 в `main` (API `/demo/links`, Nuxt layout, `pnpm test:e2e`). Фича 5 ещё нет:
клик может вести на `/r/{secret}`, который пока тупик/каркас — e2e фичи 4 проверяет
**переход URL и данные индекса**, не содержимое кабинета.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/demo-scenarios.md`, `docs/api-contracts.md`
- `docs/domain-model.md`, `docs/decisions.md` (D-005, D-008, D-012, D-016)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web` layout, generated `packages/api-client`

## Контекст продукта

ПК «Нордщит», не Вольтарис. Служебный индекс, не админка. Запрещено: каталог, логин,
копирование ссылки как основной жест, мёртвые `#`, декоративные статусы не из API,
mock-api, чат.

## Стек и границы

- `useFetch`/`useAsyncData` + facade generated client. `GET /demo/links`.
- Фильтры не нужны. Pinia не для этого списка.
- Стили только из `@theme`. Русский UI.

## TDD (обязательно e2e до страницы)

1. Напиши Playwright по AC: дисклеймер, подпись про мессенджер, 5 номеров З-10041…,
   клик по З-10043 ведёт на `/r/seed-z10043-quote-kuznetsov`. `baseURL`
   `http://localhost:3000`.
2. Запусти `pnpm test:e2e` против **живого** стенда: `make dev` (db+api+web) + seed —
   **red** (нет списка / нет текста). Не мокать `/demo/links`. Не поднимать фиктивный
   server вместо Makefile.
3. Потом страница.
4. Не упрощай до `expect(true)`. Не пиши e2e после UI «под скрин».

## Что сделать

- Страница `/`: данные API, штамп статуса, ссылки = `portalPath`.
- Явный текст: список не показывается заказчику.
- Подпись в духе «так выглядит то, что вы отправили бы заказчику в мессенджер».
- Состояния loading / error+traceId / empty.

## Что не делать

- Кабинет (фича 5), кнопка «скопировать», смена статусов, каталог.
- Пушить в `main`.

## Критерии приёмки

- Given `make dev` (db+api+web) и seed применён, When открыть `/`, Then виден дисклеймер и 5
  заявок с контрагентами, title и штампами из API (каталог `docs/domain-model.md`).
- When клик по З-10043, Then URL `/r/seed-z10043-quote-kuznetsov`.
- Нет ссылок `href="#"` и кнопок без действия.
- E2E написан до реализации страницы (есть red evidence в status). Нет mock-api.

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

Обнови `docs/implementation-status.md` (red e2e и green e2e).

## Git

Feature-ветка, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать.
