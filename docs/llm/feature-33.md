# Реализуй фичу 33: poll кабинета живой заявки

Пользователь написал «выполни фичу 33». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Кабинет живой З-10046 сам подтягивает новый статус: зритель не нажимает
«обновить» и не получает кнопки пульта. Каталожный З-10043 не поллится.

## Зависимости

Фичи 1–32 в `main` (`/start` и пульт уже есть). Соседних фич после 33 нет.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/api-contracts.md`, `docs/testing.md`
- `docs/decisions.md` (D-012, D-015, D-032, D-049, D-050, D-052)
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie / `credentials: 'include'`
  **не применять** (D-015). Не включать SWR/ISR.
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `apps/web/app/composables/useRequestPortal.ts`
- `apps/web/nuxt.config.ts`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

Ведущий жмёт «Продвинуть» на пульте; кабинет заказчика на другой вкладке
обновляется сам. Это не SWR/ISR и не таймаут авто-продвижения статуса на API.
Кнопок управления на кабинете нет. Запрещено: логин, cookie, mock-api.

## Стек и границы

- Poll `GET /requests/{accessSecret}` раз в 4 с **только** если
  `demoLive === true`. Каталожные пять поле не имеют — poll нет.
- Фраза D-052 на живом кабинете: `Эта заявка обновляется на глазах. Обновится
сама через несколько секунд.` На З-10043 этой фразы нет.
- Не Nitro `swr`/`isr` на `/r/**` (D-032). Не менять D-014.
- Cookie / `credentials: 'include'` — D-015.
- Кнопок `Продвинуть по статусу` / `Сбросить` на кабинете нет (уже F32).
- E2E против `make dev` + seed (D-021). Scenario-mutating — serial.
- Playwright: ждать видимый h1 через expect timeout ≥ 5 с, не `waitForTimeout`
  как синхронизацию (`verification-honesty`).

## TDD (обязательно e2e до poll)

1. Playwright **до** poll-кода: кабинет живой заявки открыт на «Принят»;
   advance через API (POST conductor); **без** новой навигации за 5+ с h1
   «В расчёте»; видна фраза D-052 про обновление. Каталожный З-10043 без этой
   фразы. В `nuxt.config.ts` на `/r/**` нет `swr`/`isr`. Интервал 4 s
   (source-контракт или константа, которую тест читает).
2. `pnpm test:e2e` против `make dev` + seed — **red**. Не мокать API.
3. Потом poll в кабинете.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что сделать

- Poll и фраза D-052 только при `demoLive === true`.
- Проверить отсутствие SWR/ISR на `/r/**`.
- Обнови `docs/implementation-status.md` (red и green).

## Что не делать

- Кнопки пульта на кабинете. Таймаут авто-продвижения на API.
- SWR/ISR. Redis. Логин, cookie, `credentials: 'include'`.
- Poll каталожных пяти. Мутация каталога пяти.
- Пушить в `main`.

## Критерии приёмки

- Given кабинет живой заявки на «Принят», When POST advance через API и ждать
  ≥ 5 с без новой навигации, Then h1 «В расчёте».
- Given тот же кабинет, Then видна фраза `Эта заявка обновляется на глазах.
Обновится сама через несколько секунд.`
- Given кабинет З-10043, Then этой фразы нет.
- Given `nuxt.config.ts`, Then на `/r/**` нет `swr`/`isr`.
- Given poll, Then интервал 4 секунды и только при `demoLive === true`.
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

Ветка `feat/live-cabinet-poll`, PR в `main`. Skill `git-delivery`. Не пушить в
`main`.

## После merge

Skill `pr-review`. Live-нарезка D-049 закрыта.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-052. Не добавляй SWR/ISR и кнопки пульта на кабинет.
