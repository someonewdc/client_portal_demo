# Реализуй задачу 4: подписи полей кабинета

Пользователь написал «выполни задачу 4». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Контрагент, изделие и дата обновления подписаны. Заказчик не угадывает, что за строки
под номером.

## Зависимости

Задача 3 в `main`. Задачи 5–12 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`
- `docs/decisions.md` (D-012, D-015, D-037)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Запрещено: новые поля API, логин, скачать.

Фиксированные подписи (видимый текст, `dt`/`th` или `<p>` перед значением):

- `Заказчик` → `request.counterpartyName`
- `Изделие` → `request.title`
- `Обновлено` → тот же `formatRequestUpdatedAt(request.updatedAt)`,
  `time[datetime]` сохраняется

Не подписывай номер и текущий статус заново (это задача 3).

## Стек и границы

Только кабинет `index.vue` и e2e кабинета. Лист файла — задача 10. Тип ссылки не
менять (D-034).

## TDD (red до Vue)

1. Playwright З-10043 **до** вёрстки:
   - виден текст `Заказчик` и `ИП Кузнецов П.А.`;
   - виден `Изделие` и `ВРУ 400 А` exact;
   - виден `Обновлено` рядом с `time[datetime="2026-09-04T12:00:00.000Z"]`;
   - h1 по-прежнему `КП готово`; нет плашки статуса у этой даты.
2. `pnpm test:e2e` — **red** (подписей нет).
3. Разметь подписи семантически (`<dl>` / пары label+value). Не карточки, не bento.
4. Не `skip`. Не выдумывай «Контрагент» вместо `Заказчик`.

## Что не делать

- Задачи 5–12, лист файла, индекс, API.
- Пушить в `main`.

## Критерии приёмки

- Given кабинет любой сидовой заявки, Then три поля названы фиксированными словами.
- Given задача 3, Then шапка статуса не сломана.
- Red evidence есть до green.

## Проверки

```bash
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

Ветка `fix/ux-cabinet-field-labels`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 5» → `docs/ux/task-05.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не добавляй цены и контакты менеджера.
