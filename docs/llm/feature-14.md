# Реализуй фичу 14: docs плана исправления дефектов (D-030)

## Цель

Зафиксировать в репозитории нарезку дефектов после ревью `main` и копируемые промпты
задач 1–13 (фичи 15–27). Кода продукта нет.

## Зависимости

Фичи 1–13 в `main`.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/implementation-plan.md`, `docs/testing.md`, `docs/decisions.md` (D-008, D-014,
  D-015, D-017, D-019, D-029)
- `docs/llm/feature-09.md` — шаблон docs-only поставки
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`

## Контекст продукта

ПК «Нордщит». Кабинет по секрету, индекс служебный. Запрещено: логин, OTP, mock-api,
правка `docs/source-brief.md`, реализация фич 15–27 в этом PR.

## Стек и границы

- Docs-only. Не менять Vue, Nest, Prisma, seed, e2e, Dockerfile, compose.
- `pnpm generate:api` / `pnpm db:generate` не запускать «на всякий случай».
- Отдельного red продукта нет (`docs/testing.md`: docs/Prettier).

## TDD

Не писать тесты продукта. Не утверждать, что `pnpm test` / e2e прошли, если не запускались.

## Что сделать

- D-030…D-035 в `docs/decisions.md`. У D-029 убрать «следующий ID — D-030».
- Навигатор оператора [`docs/remediation-plan.md`](../remediation-plan.md): фраза
  `выполни задачу N`, таблица задача→фича→промпт, явный out-список.
- Копируемые `docs/llm/feature-15.md` … `feature-27.md` с AC, red-командой, веткой,
  «что не делать». Промпты требуют тесты до кода, кроме чисто docs/Prettier.
- Обновить `docs/README.md`, `implementation-plan.md`, `testing.md`, `architecture.md`,
  `api-contracts.md` (D-031), `domain-model.md` (D-035), `frontend.md` (D-034),
  `AGENTS.md` (одна строка топологии), `implementation-status.md`.
- `docs/source-brief.md` не трогать.

## Что не делать

- Код `apps/*`, e2e, OpenAPI, Prisma, seed, Makefile.
- Начинать фичи 15–27.
- Пушить в `main`.

## Критерии приёмки

- Given этот PR, Then есть D-030…D-035 и `docs/remediation-plan.md` с задачами 1–13.
- Then каждый `docs/llm/feature-15.md`…`feature-27.md` самодостаточен: read set, TDD red,
  AC, ветка, стоп.
- Then D-030 запрещает CSPRNG-сиды, логин на `/demo/links`, Redis, SWR на `/r/**`.
- Then D-034 запрещает NuxtLink до фичи 16.
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

Ветка `docs/remediation-plan`, PR в `main`, не пушить в `main`. Skill `git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR. Задача 1 — отдельный чат:
«выполни задачу 1» → `docs/llm/feature-15.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать. Не реализовывать
фичи 15–27 «заодно».
