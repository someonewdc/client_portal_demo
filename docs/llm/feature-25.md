# Реализуй задачу 11 / фичу 25: NuxtLink после реактивного портала

Пользователь написал «выполни задачу 11». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Внутренние переходы — `NuxtLink`, не полный reload через сырой `<a href>`. Делать
только потому, что фича 16 уже в `main` (D-034).

## Зависимости

Фичи 1–24 в `main`, **включая фичу 16**. Если в `useRequestPortal.ts` нет `watch`
или `requestPortalCacheKey` — **стоп**, не реализовывать, напиши что F16 не в main.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-012, D-015, D-027, D-029, D-030, D-034)
- `docs/frontend.md`
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nuxt-ssr-data-and-ui/SKILL.md` — cookie **не** применять.
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/index.vue`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `apps/web/app/pages/r/[accessSecret]/d/[fileName].vue`
- `apps/web/app/composables/useRequestPortal.ts` (проверить F16)
- `e2e/demo-links.spec.ts`, `e2e/request-cabinet.spec.ts`
- `scripts/lifecycle-targets.spec.mjs`

## Контекст продукта

ПК «Нордщит». Клик по строке индекса, имени файла, «К заявке {publicNumber}».
Запрещено: ссылка с кабинета на `/`, `href="#"`, cookie, логин.

## Стек и границы

- Заменить внутренние `<a :href>` / `<a href>` на `NuxtLink` (`to` = тот же path).
  Места: индекс `portalPath`; кабинет `requestFileHref(...)`; лист
  `` `/r/${accessSecret}` `` (секрет по-прежнему не encode — base64url/fixture).
- `getByRole('link')` и assert `href` в e2e должны остаться валидными (`NuxtLink`
  рендерит `<a href>`).
- Prefetch не обязателен. Не добавляй внешние URL.
- API / Prisma не менять.

## TDD (red до Vue)

1. `node --test scripts/lifecycle-targets.spec.mjs`: в трёх страницах есть
   `NuxtLink`, нет сырого `<a` для этих переходов (допустимо оставить `<a>` только
   если его нет — полный запрет `<a` на этих файлах проще). Текущий main с `<a` —
   **red**.
2. Существующие e2e кликов не переписывать «под новое», только если сломался
   селектор. `pnpm test:e2e` против `make dev` + seed после кода — green.
3. Если lifecycle сразу green — assert слишком слабый. Не `skip`/`xit`.

## Что не делать

- Ссылку кабинета на индекс `/`.
- Cookie / `credentials: 'include'`.
- Менять тексты D-027 / D-029.
- Пушить в `main`.

## Критерии приёмки

- Given индекс, кабинет, лист, Then внутренние переходы через `NuxtLink`.
- Given e2e З-10043, Then клик имени и «К заявке» по-прежнему работают.
- Given F16 отсутствует, Then эта фича не начинается.
- Red evidence lifecycle есть до green.

## Проверки

```bash
node --test scripts/lifecycle-targets.spec.mjs
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

Ветка `fix/nuxt-link-internal-nav`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 12» → `docs/llm/feature-26.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-034. Не делай эту задачу, если F16 не в `main`.
