# Реализуй вынос ядра: генератор нового workspace (D-056)

## Цель

В `client_portal_demo` появляется способ размножить линейку ядра во **второй**
git-репозиторий, не портя стенд продаж Нордщита. Скрипт копирует allowlist в
директорию **вне этого git**, подставляет scope / имя / бренд / порты, вырезает
театр, ставит зависимости, собирает ядро. Это тест выноса: packages живут без
`apps` Нордщита.

Контракт уже записан в D-056. Этот чат пишет **код генератора**, не повторяет
docs-шаг 0 и не реализует портал Protostar.

## Зависимости

D-056 в `docs/decisions.md` (docs-нарезка шага 0). Фичи 1–33 и UX-задачи 1–20
в `main` не блокируют и этим промптом не открываются. Не используй skill
`implement-review-cycle`. Не запускай implementer/reviewer.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`, `docs/implementation-plan.md`
  (раздел «Вынос ядра»: S1–S6, allowlist, denylist, таблица rewrite — канон)
- `docs/shared-core.md`, `docs/architecture.md`, `docs/testing.md`, `docs/toolchain.md`
- `docs/decisions.md` (D-002, D-003, D-005, D-006, D-007, D-012, D-013, D-025, **D-056**)
- `.agents/skills/foundation-package-conventions/SKILL.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- корневой `package.json`, `pnpm-workspace.yaml`
- `scripts/check-boundaries.mjs` + `scripts/check-boundaries.spec.mjs`
  (канон: Node `.mjs` + `node:test`)
- `scripts/test-packages.mjs`
- `packages/*/package.json` (declared subpaths)
- `apps/api/src/bootstrap/create-application.ts`
- denylist театра из D-056: `request-catalog.ts`, `demo-links.controller.ts`,
  `demo-conductor.controller.ts`, `pages/start.vue`, `pages/c/`,
  `live-cabinet-poll.ts`, `seed-z100`, `З-1004`, `REQUEST_CATALOG`,
  `DEMO_CONDUCTOR_SECRET`, `demoLive`

## Контекст продукта

Этот git — consumer №1: `@client-portal`, порты D-006, ПК «Нордщит». Генератор
не переименовывает scope **здесь** и не извлекает новый код в packages.
Продукт Protostar (свои статусы, CLI mint, TLS, `status.protostar.ru`) —
следующий репозиторий. Запрещено: mock-api, Nx/Turborepo, npm publish,
git submodule ядра, cookiecutter/Hygen, копирование `apps/*` Вольтариса,
правка `docs/source-brief.md`.

## Стек и границы

- CLI (имена фиксированы D-056):

```bash
node scripts/scaffold-new-workspace.mjs \
  --out <abs-or-relative-dir-outside-this-git> \
  --scope @protostar \
  --name protostar-status \
  --brand Protostar \
  --preset core|portal \
  [--web-port 3100] [--api-port 3101] [--postgres-port 5434]
```

- Канон скриптов: Node `.mjs` + `node:test`. Не новый фреймворк генераторов.
- Не менять `apps/*`, `packages/*` (кроме отсутствия правок), порты D-006,
  бренд Нордщита в **этом** git.
- Не биндить `:3000`/`:3001`/`:5433` и не делать `make up` / `compose up` клона.
- `pnpm generate:api` / `pnpm db:generate` **этого** репо не запускать
  «на всякий случай» (`change-impact-gates`: apps/OpenAPI источника не менялись).

## TDD

Тесты **до** кода. Этапы **S1–S6** — канон
`docs/implementation-plan.md` (раздел «Вынос ядра»). У каждого этапа свой red,
потом минимальный green. Не один тест «весь скрипт». Команда targeted:
`node --test scripts/scaffold-new-workspace.spec.mjs`. Если этап сразу green —
перепиши assert. Не ослабляй, не `skip`/`xit`.

Allowlist, denylist и таблица rewrite — **буквально** тот же раздел плана.
Не проектируй список путей в коде.

### S1 каркас CLI (red → green)

Given нет флага / `--preset` не `core`/`portal` / `--scope` `@` или `@client-portal`
или `@Proto` или `@a/b` / `--name` `client-portal-demo` / `--brand` `Нордщит` /
порт не целое / порт `80` / порт `3000` / web=api=3100, When parse, Then exit ≠ 0,
stderr называет флаг.
Given `--out` внутри этого git или непустой dest, Then отказ, источник без новых
файлов продукта.
Given валидные флаги (defaults 3100/3101/5434), Then parse успешен и не пишет dest.

### S2 rewrite токенов (red → green)

Given фикстура строк с `@client-portal`, `ПК «Нордщит»`, `3000`/`3001`/`5433`,
`client-portal-demo`, When rewrite (`--scope @protostar --brand Protostar`
и порты 3100/3101/5434), Then в результате нет `@client-portal` и `ПК «Нордщит»`,
есть `@protostar` и порты флагов. Не копировать дерево apps на этом этапе.

### S3 guards (red → green)

Given denylist-путь из плана (`request-catalog.ts`, `demo-links.controller.ts`,
`pages/start.vue`, `live-cabinet-poll.ts`, …), Then `isTheaterPath` true.
Given фикстура с токенами `З-1004` / `demoLive` / `REQUEST_CATALOG` /
`DEMO_CONDUCTOR_SECRET`, Then `collectTheaterLeaks` непустой.
Given чистая фикстура без токенов, Then leaks пустой.

### S4 core preset (red → green)

Given scaffold `--preset core` в `os.tmpdir()` **без** `make up`, Then dest
содержит пять пакетов A; нет kit C (`pages/r/`, `RequestsModule`,
`request-portal.controller.ts`); нет denylist; leaks пустой; манифесты A без
`@client-portal`; `app.module.ts` без `RequestsModule`/`ThrottlerModule`;
`index.vue` без `/demo/links` и «Ссылки для показа». Источник `@client-portal`
и театр на месте.

### S5 portal + mixed rewrite (red → green)

Given `--preset portal`, Then есть `RequestPortalController`, `/r/{secret}`,
лист `/r/{secret}/d/{fileName}`; `requests.module.ts` без Demo/Conductor/live;
DTO/use-case без `demoLive`; seed no-op без `REQUEST_CATALOG`/`deleteMany` каталога;
`nuxt.config.ts` без `/start` и `/c/**`; нет файлов denylist. `core` по-прежнему
без этих файлов kit C.

### S6 install / build (red → green)

Given успешный S4 dest, When в dest `pnpm install` и `pnpm build:core`, Then
exit 0. По D-056 также `pnpm generate:api` в dest (health-only OpenAPI).
Не `make up` / не порты D-006.

После S6: подключи spec к корневому `"test"`; status — red и green **каждого**
S1–S6.

Отдельного red для чисто docs/Prettier нет (уже шаг 0).

## Что сделать

- `scripts/scaffold-new-workspace.mjs` по D-056 и таблицам плана: S1 parse →
  S2 rewrite → S3 scan → copy allowlist `git ls-files` → rewrite смешанных по
  таблице → S4/S5 дерево → S6 install/build/generate:api → `git init` без commit.
- Пресет `core` = A+B; `portal` = A+B+C; слой D никогда.
- Источник после прогона: театр и `@client-portal` на месте.
- D-056 и таблицы плана не переписывать «как удобнее скрипту».

## Что не делать

- Код портала Protostar, деплой, TLS, mint.
- Переименовывать `@client-portal` в этом git.
- Новые package exports.
- Копировать театр (каталог З-1004x, `/demo/links`, «Ссылки для показа»,
  `/start`, `/c/…`, live, `demoLive`, fail-closed пяти).
- `implement-review-cycle`, implementer/reviewer.
- Пушить в `main`.
- Повторять docs-only шаг 0 (D-056 уже есть).

## Критерии приёмки

- Given `--scope` `@` или `@client-portal` или `@Proto` или `@a/b`, Then отказ.
- Given порт `3000.5` / `80` / `3001` / два одинаковых из тройки web/api/postgres,
  Then отказ.
- Given нет обязательного флага или `--preset` не `core`/`portal`, Then ненулевой
  exit и stderr называет флаг.
- Given `--out` внутри этого git, Then отказ; `apps/` и `packages/` источника
  без новых файлов продукта.
- Given непустой существующий `--out`, Then отказ.
- Given порты пересекаются с `{3000, 3001, 5433}`, Then отказ.
- Given `--preset core` в tmpdir вне git, Then в dest есть пять пакетов A,
  нет файлов/токенов театра, нет `/r/` и `RequestsModule`, манифесты A без
  `@client-portal`, бренд ≠ `ПК «Нордщит»`; `pnpm build:core` в dest exit 0.
- Given `--preset portal`, Then есть GET по секрету, `/r/{secret}` и лист
  `/r/{secret}/d/{fileName}`; нет `/demo/links`, `pages/start.vue`, `pages/c/`,
  `demoLive`, `REQUEST_CATALOG`, `З-1004`.
- Given успешный прогон, Then этот git по-прежнему `@client-portal` и содержит
  театр Нордщита.
- Then в `docs/implementation-status.md` есть red и green **S1–S6** отдельно.

## Проверки

```bash
node --test scripts/scaffold-new-workspace.spec.mjs
pnpm test
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
git diff --check
```

`pnpm test:packages` — если трогали packing allowlist; иначе не утверждать.
e2e Нордщита — только если реально гоняли. Не утверждать, что `make up` клона
прошёл: его нет в AC.

## Git

Ветка `feat/scaffold-new-workspace` от `main` с D-056. Если docs-PR шага 0 ещё
не в `main` — продолжи с той же ветки, не плоди второй D-056. PR в `main`, не
пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате — skill `pr-review` на этот PR. Портал Protostar — другой
репозиторий, не этот промпт.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано.

## Стоп

Неоднозначность, которой нет в D-056 → `docs/decisions.md` (следующий ID D-057),
не угадывать в коде. Не реализовывать Protostar «заодно».
