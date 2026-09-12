# Реализуй фичу 28: docs нарезки live-сценария показа (D-049…D-052)

## Цель

Зафиксировать в репозитории нарезку live-сценария демо: вход «подать заявку» +
движение статусов одной живой заявки с пульта ведущего. Кода продукта нет.
Копируемые промпты фич 29–33 — вход следующих чатов.

## Зависимости

Фичи 1–27 и UX-задачи 1–20 в `main`.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/implementation-plan.md`, `docs/testing.md`, `docs/decisions.md` (D-008,
  D-014, D-015, D-019, D-027, D-030, D-031, D-032, D-048)
- `docs/product-scope.md`, `docs/domain-model.md`, `docs/api-contracts.md`,
  `docs/frontend.md`, `docs/demo-scenarios.md`, `docs/acceptance-checklist.md`,
  `docs/architecture.md`
- `docs/llm/feature-14.md`, `docs/llm/feature-09.md` — шаблон docs-only
- `docs/llm/feature-02.md`, `docs/llm/feature-07.md` — шаблон предметного промпта
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/github-remote/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`

## Контекст продукта

ПК «Нордщит». Демо добавляет путь, не ломая снепшоты. Пять каталожных заявок
З-10041…З-10045 не мутируют. Рядом — одна живая З-10046. Вход зрителя: экран с
одной кнопкой «Подать заявку». Движение шагов — кнопки ведущего на отдельном
пульте. Запрещено: логин, OTP, mock-api, правка `docs/source-brief.md`,
реализация фич 29–33 в этом PR, `docs/ux/task-NN.md`, remediation D-030.

## Стек и границы

- Docs-only. Не менять Vue, Nest, Prisma, seed, e2e, Dockerfile, compose.
- `pnpm generate:api` / `pnpm db:generate` не запускать «на всякий случай».
- Отдельного red продукта нет (`docs/testing.md`: docs/Prettier).

## TDD

Не писать тесты продукта. Не утверждать, что `pnpm test` / e2e прошли, если не
запускались.

## Что сделать

- D-049…D-052 в `docs/decisions.md`. У D-030 заменить «следующий свободный ID
  после D-048 — D-049» на следующий свободный после D-052 — D-053.
- Уточнить D-019 / D-031 (успех `/demo/links` — пять каталожных, З-10046 extra)
  и указатель D-032 → D-051.
- Копируемые `docs/llm/feature-28.md` … `feature-33.md` в формате F9/F14/F2/F7:
  Цель, Зависимости, Read set, Контекст, Стек и границы, TDD, Что сделать,
  Что не делать, Given/When/Then AC, Проверки, Git, После merge, Честность, Стоп.
  Промпты 29–33 требуют тесты до кода, red-команду, ветку, стоп. Не реализовывать
  их в этом PR.
- Обновить `docs/README.md`, `implementation-plan.md` (убрать «не выдумывай
  feature-28»), `testing.md`, `architecture.md`, `api-contracts.md`,
  `domain-model.md`, `frontend.md`, `product-scope.md`, `demo-scenarios.md`,
  `acceptance-checklist.md`, `AGENTS.md` (топология + оператор `выполни фичу N`),
  `implementation-status.md`.
- `docs/source-brief.md` не трогать. Промпты не класть в `docs/ux/`.

## Что не делать

- Код `apps/*`, e2e, OpenAPI, Prisma, seed, Makefile.
- Начинать фичи 29–33.
- Класть промпты в `docs/ux/`.
- Пушить в `main`.

## Критерии приёмки

- Given этот PR, Then есть D-049…D-052 и копируемые `docs/llm/feature-28.md` …
  `feature-33.md`.
- Then каждый `docs/llm/feature-29.md`…`feature-33.md` самодостаточен: read set,
  TDD red, AC Given/When/Then, ветка, стоп, «не делать соседнюю фичу».
- Then D-049 запрещает логин/401, таймаут как основной режим, кнопки пульта на
  кабинете, мутацию каталога пяти, mock-api, Redis, SWR на `/r/**`.
- Then оператор `выполни фичу N` ≠ `выполни задачу N` (D-030) ≠ UX-фразы.
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

Ветка `docs/live-demo-journey`, PR в `main`, не пушить в `main`. Skill
`git-delivery`.

## После merge

В следующем чате запусти skill `pr-review` на этот PR. Фича 29 — отдельный чат:
«выполни фичу 29» → `docs/llm/feature-29.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано.

## Стоп

Неоднозначность контракта → `docs/decisions.md`, не угадывать. Не реализовывать
фичи 29–33 «заодно». Не писать Vue/Nest/Prisma/e2e.
