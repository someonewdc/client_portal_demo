# Реализуй фичу 31: экран /start + ссылка с индекса

Пользователь написал «выполни фичу 31». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Зритель открывает `/start`, видит одну кнопку «Подать заявку» и по клику
попадает в кабинет живой З-10046 в статусе «Принят». Индекс получает блок
«Живой показ» и ссылку «Как заказчик начинает». Экрана пульта ещё нет.

## Зависимости

Фичи 1–30 в `main` (conductor API уже есть). Фичи 32–33 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/demo-scenarios.md`, `docs/acceptance-checklist.md`
- `docs/decisions.md` (D-012, D-015, D-027, D-032, D-040, D-048, D-049, D-051,
  D-052)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie / `credentials: 'include'`
  **не применять** (D-015).
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/index.vue`
- `apps/web/nuxt.config.ts`
- `e2e/demo-links.spec.ts`, `e2e/security-headers.spec.ts`

## Контекст продукта

`/start` заменяет письмо/менеджера одной кнопкой. Секрет пульта — только
server-only runtimeConfig (`NUXT_DEMO_CONDUCTOR_SECRET` / fixture
`seed-demo-conductor-nordshield`). В HTML `/start` и в `NUXT_PUBLIC_*` секрета
нет. Запрещено: логин, форма полей заявки, экран пульта, poll.

## Стек и границы

- Маршрут `/start`. Документный layout (D-048), не лендинг-геро, не UI-kit.
- Кнопка: серверный Nuxt хендлер зовёт `POST /demo/conductor/{secret}/reset`
  с секретом из server-only `runtimeConfig`, затем переход на
  `/r/seed-z10046-live-severnaya-duga`. Браузер conductor API с секретом не
  вызывает.
- Фиксированные строки — D-052, не переформулировать.
- Индекс: четыре фразы D-027 дословно. Добавить блок `Живой показ` и ссылку
  `Как заказчик начинает` → `/start`. Ссылку пульта не добавлять (фича 32).
- `routeRules` `/start` — те же capability-заголовки, что `/` и `/r/**` (D-051).
- Cookie / `credentials: 'include'` — D-015. E2E против `make dev` + seed
  (D-021). Scenario-mutating — serial.

## TDD (обязательно e2e до Vue)

1. Playwright **до** страницы `/start` и правки индекса: тексты D-052, кнопка
   `Подать заявку`, клик → кабинет З-10046, h1 «Принят»; если живая была на
   счёте — после клика снова «Принят». Индекс: `Как заказчик начинает` →
   `/start`; четыре фразы D-027 `exact`. HTML `/start` не содержит
   `seed-demo-conductor-nordshield`. Capability-заголовки на GET `/start`.
   `baseURL` `http://localhost:3000`.
2. `pnpm test:e2e` против `make dev` + seed — **red**. Не мокать API. Не
   стартовать второй Nuxt (D-021).
3. Потом страница и хендлер.
4. Не помечай экран «готовым», если e2e написан после вёрстки. Не `skip`/`xit`.

## Что сделать

- Страница `/start` и server handler reset по D-052 / D-051.
- Блок «Живой показ» + ссылка с индекса.
- `NUXT_DEMO_CONDUCTOR_SECRET` в server-only runtimeConfig (не public).
- Обнови `docs/implementation-status.md` (red и green).

## Что не делать

- Экран `/c/{secret}`, кнопки «продвинуть»/«сбросить» на кабинете, poll (F32–33).
- Логин, cookie, `credentials: 'include'`, секрет пульта в HTML `/start`.
- Перефразировать четыре фразы D-027.
- Мутировать каталог пяти. SWR/ISR на `/r/**`.
- Пушить в `main`.

## Критерии приёмки

- Given стенд `make dev` + seed, When открыть `/start`, Then видны h1
  `Подать заявку`, title `Подать заявку — ПК «Нордщит»`, оба абзаца D-052 и
  кнопка `Подать заявку`.
- Given клик `Подать заявку`, Then переход на
  `/r/seed-z10046-live-severnaya-duga` и статус «Принят».
- Given живая заявка на `invoice_issued`, When клик `Подать заявку`, Then снова
  «Принят».
- Given индекс `/`, When искать `Как заказчик начинает`, Then ссылка на
  `/start`; четыре фразы D-027 дословны.
- Given HTML `/start`, Then нет строки `seed-demo-conductor-nordshield`.
- Given GET `/start`, Then capability-заголовки D-032/D-051.
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

Ветка `feat/live-start-page`, PR в `main`. Skill `git-delivery`. Не пушить в
`main`.

## После merge

Skill `pr-review`. Дальше: «выполни фичу 32» → `docs/llm/feature-32.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-052. Не делай экран пульта и poll кабинета.
