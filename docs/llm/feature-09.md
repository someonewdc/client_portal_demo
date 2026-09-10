# Реализуй фичу 9: docs статусного документа (D-027)

## Цель

Зафиксировать в репозитории контракт кабинета как статусного документа по ссылке, без
тулбара и без кнопки «скачать». Кода продукта нет. Промпты фич 10–12 — копируемый вход
следующих чатов.

## Зависимости

Фичи 1–8 в `main`.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/frontend.md`, `docs/demo-scenarios.md`, `docs/acceptance-checklist.md`
- `docs/implementation-plan.md`, `docs/testing.md`, `docs/decisions.md` (D-009, D-012,
  D-020, D-026)
- `docs/llm/feature-07.md` — шаблон промпта
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`

## Контекст продукта

ПК «Нордщит». Кабинет снаружи по секрету. Не панель управления. Запрещено: чат, OTP,
логин, скачать, `#`, mock-api, правка `docs/source-brief.md`.

## Стек и границы

- Docs-only. Не менять Vue, e2e, OpenAPI, Prisma, seed.
- `pnpm generate:api` / `pnpm db:generate` не запускать «на всякий случай».
- Отдельного red e2e нет (`docs/testing.md`: docs/Prettier).

## TDD

Не писать тесты продукта. Не утверждать, что `pnpm test` / e2e прошли, если не запускались.

## Что сделать

- D-027 в `docs/decisions.md`.
- Экранные контракты в `docs/frontend.md`, сценарий, чеклист, план, testing, README,
  одна строка топологии в `AGENTS.md`.
- Копируемые `docs/llm/feature-09.md` … `feature-12.md` с фиксированными строками и AC
  Given/When/Then. Промпты 10–12 явно пишут «тесты до кода».
- `docs/implementation-status.md`: этап F9 выполнен (без выдуманных lint/test продукта).

Фиксированные строки (не выдумывать):

- `Статус заявки`
- `Менеджер отправил вам эту ссылку. Вход не нужен.`
- `ещё нет`
- `questionnaire` → `Опросный лист`, `quote` → `КП`, `invoice` → `Счёт`
- размер: `Math.round(byteSize / 1000) + ' КБ'`
- `Ссылки для показа`
- `Нажмите строку — откроется экран заказчика по ссылке.`
- дисклеймер и подпись про мессенджер на индексе не переформулировать

## Что не делать

- Код `apps/web`, e2e, API, seed.
- Кнопка «скачать», ссылка с кабинета на `/`.
- Пушить в `main`.

## Критерии приёмки

- Given этот PR, Then в `docs/decisions.md` есть D-027: статусный документ, статус только
  в ленте, файлы-записи, API не менять, индекс с заголовком и инструкцией клика.
- Then `docs/llm/feature-10.md` … `feature-12.md` содержат те же фиксированные строки.
- Then `docs/frontend.md` запрещает дубль статуса у даты и кнопку «скачать».
- Then промпты 10–12 требуют тесты до кода (red evidence).
- Then `docs/source-brief.md` не изменён.

## Проверки

```bash
pnpm format
pnpm format:check
git diff --check
```

Не утверждать, что `pnpm lint` / `pnpm test` / e2e прошли. Обнови
`docs/implementation-status.md`.

## Git

Ветка `docs/status-document-ia`, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR. Фича 10 — отдельный чат по
`docs/llm/feature-10.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать.
