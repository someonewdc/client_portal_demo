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

**E2E (Playwright, скрипт `test:e2e` заводит F3):**

- `baseURL` `http://localhost:3000`. Сценарии индекса и кабинета гоняют против `make dev`
  (db+api+web) + seed, не против mock-api и не против фиктивного server.
- F4 пишет сценарий индекса **до** страницы: дисклеймер, список из API, клик → `/r/…`.
- F5 пишет сценарий кабинета и тупика **до** страницы.
- Селекторы: role / label / осмысленный `data-testid`, не CSS-хрупкость. Без
  `waitForTimeout` как синхронизации (`verification-honesty`).
- Scenario-mutating e2e — serial. Этот демо read-only, мутаций нет.

**Compose-smoke (F6):** тот же `make up` после расширения (D-016) отвечает health и отдаёт
индекс.

## Корневые команды

Сверяй имена с `package.json`. Сейчас есть: `pnpm check:boundaries`, `lint`, `typecheck`,
`test`, `test:packages`, `build`, `db:generate`, `db:migrate`, `db:seed`, `generate:api`.

Ещё нет (заводят фичи, AC это проверяет): `pnpm test:e2e`.

Для docs-only поставки: Prettier / `git diff --check`. Не утверждать, что lint/test
продукта прошли, если не запускались.
