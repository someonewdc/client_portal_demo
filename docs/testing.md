# Тестирование и TDD

## Зачем TDD здесь

LLM часто пишет код, затем тесты «под него». Такие тесты зелёные всегда и не ловят регресс.
Поэтому тесты по приёмке пишут **до** кода. Протокол обязателен в `AGENTS.md`.

## Протокол (каждая предметная фича)

1. Сформулировать AC (Given/When/Then) из `docs/llm/feature-NN.md`.
2. Написать targeted-тесты по AC, не по будущим именам классов.
3. Запустить. Зафиксировать **red**: полная команда, exit ≠ 0, причина (нет маршрута, 503,
   нет текста на странице).
4. Если прогон уже green — это провал TDD. Переписать assert так, чтобы отсутствие поведения
   валило тест.
5. Минимальный код до green. Запрещено: ослабить assert, `skip`/`xit`, поменять ожидаемое
   значение «чтобы прошло», snapshot без смысловой проверки, e2e который зелёный на пустой
   странице.
6. В `docs/implementation-status.md` — строка red и строка green.

Не требовать отдельный red: чисто docs/Prettier; generate-only файлы после того, как
контрактный тест уже red.

## Минимум по слоям

**Unit / application (Vitest в `apps/api`, packages как сейчас):**

- F1: `ReadinessService` — не ready, пока ping не успешен; live не зависит от БД.
- F2: lookup по хешу секрета; неизвестный секрет → typed not-found; маппинг статусов и
  `stages` из четырёх шагов; seed fixture-секреты стабильны.

**HTTP integration (`apps/api`):**

- F1: `GET /api/v1/health/live` 200 при недоступной БД; `GET /health/ready` 503 Problem
  Details после `markReady`, если БД недоступна; 200 `{ data.status: "ok" }` когда
  Postgres отвечает (`make verify` / CI-сервис, не сырой `pnpm test` без БД).
- F2: `GET /demo/links` — envelope 1:1 (`data.items` + `meta.traceId`), поля сидов из
  `docs/domain-model.md` (включая `status`/`statusLabel`/`counterpartyName`/`updatedAt`);
  лишняя строка в БД → 500; повторный seed удаляет её (D-019); `GET /requests/{secret}` 200
  для fixture с датами, подписями шагов и полным `files`; 404 Problem Details: `detail` без
  SQL/stack и без секрета; `instance`/path могут содержать секрет (D-014). HTTP-тесты
  фиксируют UTC ISO при `TZ=Europe/Moscow`; колонки дат — `timestamptz`.

**E2E (Playwright, скрипт `pnpm test:e2e` / `make e2e`, D-024):**

- `baseURL` `http://localhost:3000`. Сценарии индекса и кабинета гоняют против `make dev`
  (db+api+web) + seed, не против mock-api и не против фиктивного server (D-021).
- `make e2e` и `make verify` ставят Chromium (`playwright install --with-deps chromium`);
  сырой `pnpm test:e2e` браузер не ставит.
- F3 не проверяет HTTP `:3000` (только workspace / Makefile). HTML на порту — smoke F5.
- F5 — harness и smoke шапки layout; `reuseExistingServer: true`.
- F6 пишет сценарий индекса **до** страницы: дисклеймер, список из API, клик → `/r/…`.
- F7 пишет сценарий кабинета и тупика **до** страницы.
- F8 гоняет те же спеки против `make up`, не против встроенного Playwright `webServer`.
- F9 — docs-only (D-027, промпты 10–12): отдельного red e2e нет.
- F10 пишет e2e рамки документа и ленты 1–4 с `reachedAt` / `ещё нет` **до** правки Vue.
- F11 пишет unit formatters и e2e файлов-записей / колонки комментария **до** UI.
- F12 пишет e2e заголовка индекса и инструкции клика **до** правки `index.vue`.
- F13 пишет unit `requestFileHref` / зачина листа и e2e клика имени файла **до** Vue.
- F14 — docs-only (D-030, промпты 15–27, `docs/remediation-plan.md`): отдельного red
  продукта нет.
- F15 пишет unit `routeParamValue('file%2Fname.pdf')` **до** правки decode.
- F16 пишет unit ключа портала и source-контракт `watch` **до** composable.
- F17 пишет unit document status и source-контракт `setResponseStatus` **до** страниц.
- F18 пишет unit/HTTP неполного каталога **до** use-case.
- F19 пишет information_schema unique `(requestId, fileName)` **до** migration.
- F20 пишет e2e заголовков HTML **до** `routeRules`.
- F21 пишет HTTP `Cache-Control` capability JSON **до** interceptor/header.
- F22 пишет unit twin-origin и source-контракт CORS **до** `enableCors`.
- F23 пишет package test timeout **до** fetch wrapper.
- F24 пишет HTTP 429 при limit=1 **до** ThrottlerGuard.
- F25 пишет source-контракт `NuxtLink` **до** Vue (F16 уже в `main`).
- F26 пишет source-контракт `USER node` **до** Dockerfile.
- F27 пишет source-контракт `127.0.0.1:` в compose **до** правки портов.
- UX docs-нарезка (D-036 / D-042, `docs/ux/`, вход `выполни ux задачу N` /
  `реализуй ux задачу N`) — отдельного red продукта нет.
- UX задача 1 пишет e2e `:focus-visible` outline **до** CSS.
- UX задача 2 пишет e2e «бренд не heading / смысловой h1 / title» **до** layout.
- UX задача 3 пишет e2e h1 = текущий статус **до** шапки кабинета.
- UX задача 4 пишет e2e подписей `Заказчик` / `Изделие` / `Обновлено` **до** Vue.
- UX задача 5 пишет e2e фраз «что дальше» **до** Vue.
- UX задача 6 пишет e2e `aria-current="step"` **до** ленты.
- UX задача 7 пишет e2e ленты на 390px **до** классов.
- UX задача 8 пишет e2e спеки на 390px **до** таблицы.
- UX задача 9 пишет e2e фразы про выписку **до** блока файлов.
- UX задача 10 пишет e2e полной спеки листа **до** страницы листа.
- UX задача 11 пишет e2e двух текстов 404 **до** тупиков.
- UX задача 12 пишет e2e `font-weight` штампа индекса **до** Vue.
- UX задача 13 пишет e2e цвета `.document-link` на имени и «К заявке» **до** CSS.
- UX задача 14 пишет e2e акцента номера/title индекса **до** Vue.
- UX задача 15 пишет e2e общих X имён файлов **до** сетки.
- UX задача 16 пишет e2e общих X дат ленты на 1280px **до** колонок.
- UX задача 17 пишет e2e общих X qty на листе **до** таблицы листа.
- UX задача 18 пишет e2e однострочного `th` «Кол-во» **до** ширин колонок.
- Селекторы: role / label / осмысленный `data-testid`, не CSS-хрупкость. Без
  `waitForTimeout` как синхронизации (`verification-honesty`).
- Scenario-mutating e2e — serial. Этот демо read-only, мутаций нет.

**Compose-smoke (F8):** тот же `make up` после расширения (D-016) отвечает health и отдаёт
индекс (`scripts/compose-smoke.mjs`).

## Корневые команды

Сверяй имена с `package.json`. Сейчас есть: `pnpm check:boundaries`, `lint`, `typecheck`,
`test`, `test:e2e`, `test:packages`, `build`, `db:generate`, `db:migrate`, `db:seed`,
`generate:api`. `apps/web` в `typecheck`/`build` и `make dev` — фича 3; HTML на `:3000` —
smoke фичи 5 (`make e2e`).

Для docs-only поставки: Prettier / `git diff --check`. Не утверждать, что lint/test
продукта прошли, если не запускались.
