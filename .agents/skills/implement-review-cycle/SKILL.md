---
name: implement-review-cycle
description: >-
  Dispatches one plan item through plan-item-implementer, then
  plan-diff-reviewer, then resume-implementer on must-fix. Use when the
  user writes implement→review / через implement → review, реализуй ux
  задачу N, or names this skill. Do not use for a bare «следующий пункт»,
  «суперагент», выполни задачу N, выполни ux задачу N, /review,
  /review-bugbot, /review-security, or GitHub PR review (pr-review).
---

# Implement → review cycle

Родитель в этом чате — только диспетчер. Код пишет `plan-item-implementer`.
Ревью делает `plan-diff-reviewer` в чистом контексте. Это не `/review`, не
Bugbot, не `pr-review` и не хуки `stop` / `subagentStop`.

## Opt-in

Цикл включается, если пользователь явно написал одно из:

- `через implement → review` / `implement→review`;
- имя этого skill;
- `реализуй ux задачу N` (D-042: цикл входит во фразу, отдельно «через …»
  не нужно).

Голые «суперагент», «следующий пункт», `выполни задачу N`, `выполни ux задачу N`
без фразы цикла и без `реализуй` — не этот skill: один чат по промпту пункта.
`реализуй задачу N` без слова `ux` цикл не включает и `docs/ux/` не открывает.
Если skill открыли без фразы цикла — не диспатчь, скажи человеку и остановись.

## Планы (не выдумывай формат)

Канон предметных фич: [`docs/implementation-plan.md`](../../../docs/implementation-plan.md),
промпт [`docs/llm/feature-NN.md`](../../../docs/llm/feature-01.md).

Дефекты кода (`выполни задачу N` без `ux`):
[`docs/remediation-plan.md`](../../../docs/remediation-plan.md) → тот же `feature-NN.md`.

UX (`выполни ux задачу N` или `реализуй ux задачу N`):
[`docs/ux/README.md`](../../../docs/ux/README.md) →
[`docs/ux/task-NN.md`](../../../docs/ux/task-01.md).
`реализуй ux задачу N` всегда этот цикл (задачи 13–18 так и задуманы).

Готовность пунктов — [`docs/implementation-status.md`](../../../docs/implementation-status.md)
(таблица этапов / журнал). В планах нет чекбоксов — не добавляй.

Если пользователь дал текст пункта сам — это spec; новый файл плана не создавай.

«Следующий пункт» — только из явно названного плана (путь или имя:
`docs/ux/README.md`, `docs/implementation-plan.md`, `docs/remediation-plan.md`).
Первый ещё не `проверен` / не в `main` по status. Если все закрыты — стоп,
скажи человеку. План не назван и нет текста пункта / номера задачи — стоп,
спроси какой план. Не угадывай UX vs remediation.

## Запреты родителю

1. Не редактировать код самому. Запрещены Write / StrReplace / правки через shell
   для исходников. Можно: читать план и status, `git status` / `git diff` /
   `git log`. Status пункта пишет implementer в `docs/implementation-status.md`
   (так принято), не родитель.
2. Если цикл включён: всегда явно запускать `plan-item-implementer`, дождаться
   завершения, затем `plan-diff-reviewer`.
3. Промпт reviewer = формулировка пункта из плана (или путь к `feature-NN.md` /
   `task-NN.md` + цитата цели/AC) + фактический diff / список файлов. Запрещено
   пересылать rationale реализатора, «он уже учёл X», пересказ решения, статус-эссе.
4. Промпт implementer при resume = отчёт reviewer as-is + «исправь must-fix,
   nits по усмотрению, не оспаривай стиль ревьюера без фактической ошибки».
5. Must-fix нельзя пропустить без явной причины в финальном ответе человеку.
6. Не запускать implementer и reviewer параллельно на одну задачу.
7. Лимит итераций 2–3 (не больше трёх проходов reviewer), затем стоп и отчёт
   человеку.

Не чини замечания сам. Не подменяй агентов `generalPurpose`, `explore`,
`bugbot`, `security-review`. `readonly` и модель задаёт frontmatter агента;
в Task `model` не передавай (на resume — тоже). `run_in_background: false`.

## Последовательность

1. Нет фразы цикла и skill не назван — стоп (раздел Opt-in). Иначе прочитай
   **названный** план и `docs/implementation-status.md`. Возьми один пункт
   (или spec текстом от пользователя). Соседние пункты не открывай. План не
   назван и нет spec — стоп, спроси человека. `реализуй ux задачу N` называет
   план [`docs/ux/README.md`](../../../docs/ux/README.md) и пункт
   `docs/ux/task-NN.md`.
2. `git status --short`. Если дерево грязное до старта этого пункта (чужой
   unstaged/uncommitted diff) — стоп, скажи человеку. Не запускай implementer
   поверх чужой работы. После implementer грязное дерево ожидаемо.
3. Task `plan-item-implementer`, дождись. В prompt: путь промпта / текст пункта,
   «один пункт, без соседних заодно», TDD и skills из `AGENTS.md` по поверхности.
   Сохрани agent id для resume.
4. Сам сними `git diff` / список путей относительно merge-base с `main` (или
   working tree). Не пересказывай, что сделал implementer.
5. Task `plan-diff-reviewer`, дождись. В prompt только spec + diff/пути.
6. Нет must-fix → стоп. Ответ человеку: пункт, таблица ревью, как проверить.
   Nits можно не чинить.
7. Есть must-fix и кругов < 3 → resume того же implementer (запрет 4),
   дождись, снова шаги 4–5 с новым diff. Reviewer каждый раз новый, не resume.
8. После третьего ревью must-fix остались → стоп. Не начинай четвёртый круг.
   В ответе человеку: что не сошлось и какие must-fix открыты.

## Промпт implementer (первый запуск)

```text
Один пункт. Соседние не трогать.

Spec: <путь docs/llm/feature-NN.md | docs/ux/task-NN.md | текст пункта>

Следуй промпту пункта и AGENTS.md. В конце — структурированный статус
(сделано / файлы / как проверить). Без эссе «почему так».
```

## Промпт reviewer

```text
Spec пункта (как в плане, без рассказа реализатора):
<цитата цели и AC или путь к промпту>

Файлы / diff:
<git diff или список путей>

Проверь соответствие spec, баги, регрессии, дыры в проверках.
Не переписывай код. Отчёт: Severity | Location (file:line) | Finding | must-fix/nit.
Сначала blockers.
```
