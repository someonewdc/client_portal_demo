# Реализуй фичу 7: кабинет по секрету + тупик 404

## Цель

Заказчик (и зритель) открывает ссылку и видит одну заявку: жива, какой шаг, что в
спецификации, какие файлы. Несуществующий секрет — тупик, не логин.

## Зависимости

Фичи 1–6 в `main` (индекс уже кликает на `/r/{secret}`). Фича 8 не обязательна.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/demo-scenarios.md`, `docs/api-contracts.md`
- `docs/domain-model.md`, `docs/acceptance-checklist.md`
- `docs/decisions.md` (D-007, D-008, D-009, D-012, D-014, D-015, D-016, D-020, D-021)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie / `credentials: 'include'`
  **не применять** (D-015).
- `.agents/skills/nestjs-hexagonal-boundaries/SKILL.md` (если трогаешь API)
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web` индекс, `packages/api-client`

## Контекст продукта

ПК «Нордщит». Кабинет снаружи по секрету. Этапы: принят → в расчёте → КП → счёт. Спека не
SKU. Файлы — список имён без «скачать». Запрещено: чат, OTP, логин, телефон, каталог,
мертвые CTA, админка статусов, mock-api.

## Стек и границы

- Маршрут `/r/[accessSecret]`. Данные: `GET /requests/{accessSecret}` через facade
  фичи 6 + `useAsyncData`/`useFetch`. Cookie / `credentials: 'include'` — D-015.
- 404 API → тупик UI, не форма. Problem Details: безопасное сообщение + `traceId`.
- Web не импортирует Prisma / Nest DTO.
- E2E против `make dev` + seed, без второго Nuxt на `:3000` (D-021).

## TDD (обязательно e2e до страницы)

1. Playwright: З-10043 — номер, «КП готово», четыре штампа, строки спецификации из
   каталога (в т.ч. «Вводно-распределительное устройство 400 А»), имя `КП-З-10043.pdf`,
   дата обновления, «ПК «Нордщит»». Второй тест: `/r/this-secret-does-not-exist` —
   тупик, нет полей входа/телефона/OTP. `baseURL` `http://localhost:3000`.
2. `pnpm test:e2e` против `make dev` + seed — **red**. Не мокать API. Не стартовать
   второй Nuxt (D-021).
3. Потом страница.
4. Не помечай кабинет «готовым», если e2e написан после вёрстки под уже видимый DOM.

## Что сделать

- Кабинет по `docs/frontend.md` и payload `docs/api-contracts.md`.
- Лента четырёх штампов, не канбан.
- Файлы: текст списка, без кнопки скачивания.
- Понятный 404.

## Что не делать

- Upload, оплата, чат, OTP, редактирование, кнопка скачать, `#`.
- Cookie forwarding, `credentials: 'include'` (D-015).
- Второй Nuxt на `:3000` (D-021).
- Пушить в `main`.

## Критерии приёмки

- Given fixture З-10043 и стенд `make dev` + seed, When открыть
  `/r/seed-z10043-quote-kuznetsov`, Then видны номер, контрагент, текущий штамп «КП готово»,
  пройденные шаги, spec lines из каталога, файл `КП-З-10043.pdf`, `updatedAt`.
- Given неизвестный секрет, When открыть `/r/this-secret-does-not-exist`, Then тупик на
  русском без login form.
- Given тот же секрет, When API GET, Then 404 Problem Details (`detail` без секрета; path в
  `instance` допустим, D-014).
- Клик с индекса (фича 6) открывает заполненный кабинет, не пустышку.
- Нет мёртвых кнопок.

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

Если менял контракт — `pnpm generate:api`. Обнови `docs/implementation-status.md` (red и
green).

## Git

Feature-ветка, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать.
