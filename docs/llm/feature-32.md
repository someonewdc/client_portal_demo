# Реализуй фичу 32: экран пульта /c/{secret} + ссылка с индекса

Пользователь написал «выполни фичу 32». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Ведущий открывает `/c/{conductorSecret}` и кнопками двигает живую заявку.
Чужой секрет — тупик 404, как у кабинета. Индекс получает ссылку «Пульт смены
шага». Poll кабинета ещё нет.

## Зависимости

Фичи 1–31 в `main` (`/start` уже есть). Фичу 33 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/demo-scenarios.md`, `docs/api-contracts.md`
- `docs/decisions.md` (D-012, D-015, D-027, D-032, D-039, D-040, D-048, D-049,
  D-051, D-052)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie / `credentials: 'include'`
  **не применять** (D-015).
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/index.vue`
- `apps/web/nuxt.config.ts`
- `e2e/demo-links.spec.ts`, `e2e/request-cabinet.spec.ts`,
  `e2e/security-headers.spec.ts`

## Контекст продукта

Пульт — родственник индексу `/`, не ERP-админка и не кабинет заказчика.
Движение шагов только отсюда. На `/r/{secret}` кнопок пульта нет. Запрещено:
логин, 401, poll, таймаут как основной режим.

## Стек и границы

- Маршрут `/c/{conductorSecret}`. Данные: GET conductor через facade +
  `useAsyncData`. POST advance/reset тем же секретом из path (не из
  `NUXT_PUBLIC_*`). Cookie нет (D-015).
- Фиксированные строки D-052. Документный layout (D-048).
- Чужой секрет: h1 `Ссылка недействительна`, HTTP 404, текст тупика кабинета
  (D-039), без логина.
- Индекс: в блоке `Живой показ` ссылка `Пульт смены шага` →
  `/c/{conductorSecret}`. Индекс служебный — секрет в `href` допустим (D-051).
  Четыре фразы D-027 не трогать.
- `routeRules` `/c/**` — capability-заголовки D-051.
- E2E против `make dev` + seed (D-021). Scenario-mutating — serial.
- Poll кабинета не делать (фича 33).

## TDD (обязательно e2e до Vue)

1. Playwright **до** страницы пульта: `/c/nope` — тупик 404; верный секрет —
   h1 `Пульт показа`, кнопки `Продвинуть по статусу` и `Сбросить`; продвинуть →
   открыть кабинет (навигация) «В расчёте»; сброс → «Принят». Индекс: `Пульт
  смены шага`. На `/r/{secret}` нет кнопок пульта. Capability-заголовки на
   `/c/{fixture}`.
2. `pnpm test:e2e` против `make dev` + seed — **red**. Не мокать API. Не
   стартовать второй Nuxt (D-021).
3. Потом страница.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что сделать

- Страница `/c/{conductorSecret}` по D-052.
- Ссылка с индекса. `routeRules` `/c/**`.
- Обнови `docs/implementation-status.md` (red и green).

## Что не делать

- Poll кабинета (F33). Кнопки «продвинуть»/«сбросить» на `/r/{secret}`.
- Логин, cookie, `credentials: 'include'`, HTTP 401.
- Перефразировать D-027 / D-052. SWR/ISR на `/r/**`.
- Мутировать каталог пяти. Redis. mock-api.
- Пушить в `main`.

## Критерии приёмки

- Given `/c/nope`, Then тупик 404: h1 `Ссылка недействительна`, без логина.
- Given `/c/seed-demo-conductor-nordshield`, Then h1 `Пульт показа`, title
  `Пульт показа — ПК «Нордщит»`, фраза `Этот экран не показывается заказчику.`,
  кнопки `Продвинуть по статусу` и `Сбросить`.
- Given «Продвинуть по статусу» с `accepted`, When открыть кабинет живой заявки
  (навигация), Then h1 «В расчёте».
- Given «Сбросить», Then кабинет живой заявки — «Принят».
- Given индекс `/`, Then ссылка `Пульт смены шага` на `/c/{fixture}`.
- Given кабинет `/r/{secret}`, Then нет кнопок `Продвинуть по статусу` и
  `Сбросить`.
- Red evidence есть до green.

## Проверки

```bash
pnpm test:e2e
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`pnpm generate:api` не запускать, если OpenAPI не менялся. Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `feat/live-conductor-ui`, PR в `main`. Skill `git-delivery`. Не пушить в
`main`.

## После merge

Skill `pr-review`. Дальше: «выполни фичу 33» → `docs/llm/feature-33.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-051 / D-052. Не делай poll кабинета (фича 33).
