# Реализуй задачу 6 / фичу 20: заголовки capability на Nuxt

Пользователь написал «выполни задачу 6». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

HTML `/`, `/r/**` не кэшируется общим кэшем, не отдаёт Referer с секретом, не
индексируется и не встраивается в чужой iframe.

## Зависимости

Фичи 1–19 в `main`. Фичи 21–27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-012, D-015, D-030, D-032)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie **не** применять.
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/nuxt.config.ts`
- `e2e/layout-header.spec.ts` — куда добавить header assert
- [Nuxt routeRules](https://nuxt.com/docs/4.x/guide/concepts/rendering#route-rules)

## Контекст продукта

Секрет в path — capability (D-008). W3C/OWASP: `Cache-Control: no-store`,
`Referrer-Policy: no-referrer`, не индексировать. Запрещено: логин, `nuxt-security`,
SWR/ISR на `/r/**`, cookie.

## Стек и границы

- Только [`apps/web/nuxt.config.ts`](../../apps/web/nuxt.config.ts) `routeRules`.
  Не ставить npm-модуль `nuxt-security`.
- Правила минимум на `'/'` и `'/r/**'` (или `'/**'` если проще и не ломает статику
  `_nuxt` — если ломает hashed assets, не ставь `no-store` на `/_nuxt/**`).
- Заголовки буквально (D-032):
  - `Cache-Control: private, no-store`
  - `Referrer-Policy: no-referrer`
  - `X-Robots-Tag: noindex, nofollow`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
- API не трогать (фича 21). Не включать `swr` / `isr`.

## TDD (red до config)

1. Playwright: в `e2e/layout-header.spec.ts` (или новый `e2e/security-headers.spec.ts`)
   `page.goto('/')` и `page.goto('/r/seed-z10043-quote-kuznetsov')` — response headers
   содержат пять имён/значений выше (сравнение case-insensitive, value содержит
   `no-store` / `no-referrer` / `noindex` / `DENY` / `nosniff`).
   `pnpm test:e2e` против `make dev` + seed — **red**.
2. `routeRules` в `nuxt.config.ts`. Dev-сервер подхватит после рестарта `make dev`.
3. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что не делать

- `@nuxtjs/security` / `nuxt-security`.
- Nitro `swr`/`isr` на `/r/**`.
- Менять API, Helmet, тексты страниц.
- Cookie / `credentials: 'include'`.
- Пушить в `main`.

## Критерии приёмки

- Given GET `/` и кабинет З-10043, Then пять заголовков D-032 на HTML.
- Given D-032, Then нет SWR на `/r/**`.
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

`pnpm generate:api` / `pnpm db:generate` не запускать «на всякий случай». Обнови
`docs/implementation-status.md` (red и green).

## Git

Ветка `fix/nuxt-capability-headers`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 7» → `docs/llm/feature-21.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-032. Не ставь CSP, который ломает Tailwind/`_nuxt`.
