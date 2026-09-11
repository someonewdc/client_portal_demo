---
name: implement-review-cycle
description: >-
  Dispatches one plan item through plan-item-implementer, then
  plan-diff-reviewer, then resume-implementer on must-fix. Use when the user
  asks for implement→review, суперагент, следующий пункт из плана, or names
  this skill. The parent does not write or review code. Do not use for /review,
  /review-bugbot, /review-security, or GitHub PR review (pr-review).
---

# Implement → review cycle

Родитель в этом чате — только диспетчер. Код пишет `plan-item-implementer`.
Ревью делает `plan-diff-reviewer` в чистом контексте. Это не `/review`, не
Bugbot, не `pr-review` и не хуки `stop` / `subagentStop`.

## Планы (не выдумывай формат)

Канон предметных фич: [`docs/implementation-plan.md`](../../../docs/implementation-plan.md),
промпт [`docs/llm/feature-NN.md`](../../../docs/llm/feature-01.md).

Дефекты кода (`выполни задачу N` без `ux`):
[`docs/remediation-plan.md`](../../../docs/remediation-plan.md) → тот же `feature-NN.md`.

UX (`выполни ux задачу N`): [`docs/ux/README.md`](../../../docs/ux/README.md) →
[`docs/ux/task-NN.md`](../../../docs/ux/task-01.md).

Готовность пунктов — [`docs/implementation-status.md`](../../../docs/implementation-status.md)
(таблица этапов / журнал). В планах нет чекбоксов — не добавляй.

Если пользователь дал текст пункта сам — это spec; новый файл плана не создавай.

«Следующий пункт» из названного плана: первый ещё не `проверен` / не в `main` по
status. Если все закрыты — стоп, скажи человеку.

## Запреты родителю

1. Не редактировать код самому. Запрещены Write / StrReplace / правки через shell
   для исходников. Можно: читать план и status, `git status` / `git diff` /
   `git log`. Status пункта пишет implementer в `docs/implementation-status.md`
   (так принято), не родитель.
2. Всегда явно запускать `plan-item-implementer`, дождаться завершения, затем
   `plan-diff-reviewer`.
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

1. Прочитай названный план и `docs/implementation-status.md`. Возьми один пункт
   (или spec текстом от пользователя). Соседние пункты не открывай.
2. Task `plan-item-implementer`, дождись. В prompt: путь промпта / текст пункта,
   «один пункт, без соседних заодно», TDD и skills из `AGENTS.md` по поверхности.
   Сохрани agent id для resume.
3. Сам сними `git diff` / список путей относительно merge-base с `main` (или
   working tree). Не пересказывай, что сделал implementer.
4. Task `plan-diff-reviewer`, дождись. В prompt только spec + diff/пути.
5. Нет must-fix → стоп. Ответ человеку: пункт, таблица ревью, как проверить.
   Nits можно не чинить.
6. Есть must-fix и кругов < 3 → resume того же implementer (запрет 4),
   дождись, снова шаги 3–4 с новым diff. Reviewer каждый раз новый, не resume.
7. После третьего ревью must-fix остались → стоп. Не начинай четвёртый круг.
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
