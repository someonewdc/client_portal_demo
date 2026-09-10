# Реализуй задачу 5: фраза «что дальше» по статусу

Пользователь написал «выполни задачу 5». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

После шапки кабинета зритель читает одну фразу, что происходит сейчас и чего ждать.
Без оплаты, чата и телефона.

## Зависимости

Задача 4 в `main`. Задачи 6–12 не начинать. Фичи 15–27 не реализовывать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/ux/README.md`, `docs/frontend.md`, `docs/domain-model.md`
- `docs/decisions.md` (D-007, D-012, D-015, D-037)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/web/app/pages/r/[accessSecret]/index.vue`
- `e2e/request-cabinet.spec.ts`

## Контекст продукта

ПК «Нордщит». Четыре статуса D-007. Запрещено: оплата, «написать нам», OTP, `#`.

Фиксированные фразы (ровно, по `request.status`):

| status           | Текст                                                     |
| ---------------- | --------------------------------------------------------- |
| `accepted`       | `Заявку приняли. Сейчас готовят расчёт.`                  |
| `in_calculation` | `Идёт расчёт. Коммерческое предложение ещё не готово.`    |
| `quote_ready`    | `Коммерческое предложение готово. Счёт ещё не выставлен.` |
| `invoice_issued` | `Счёт выставлен. Оплата в этом окне не принимается.`      |

## Стек и границы

Кабинет `index.vue` + e2e. Вынеси map в `apps/web/app/utils/`, если так проще unit.
API не менять. Тип ссылки не менять (D-034).

## TDD (red до кода)

1. Если есть unit — `pnpm --filter @client-portal/web test` на map статус→фраза
   **до** функции (red: нет экспорта).
2. Playwright **до** Vue:
   - З-10043: виден exact
     `Коммерческое предложение готово. Счёт ещё не выставлен.`;
   - З-10041 `/r/seed-z10041-accepted-severenergo`:
     `Заявку приняли. Сейчас готовят расчёт.`;
   - З-10044 `/r/seed-z10044-invoice-teplitsy`:
     `Счёт выставлен. Оплата в этом окне не принимается.`;
   - нет кнопки, нет `a[href="#"]`, нет слова «оплатить» как CTA.
3. `pnpm test:e2e` — **red**.
4. Один `<p>` после блока ссылки/подписей, до ленты. Не баннер AfterShip, не alert.

## Что не делать

- Задачи 6–12, фичи 15–27.
- Телефон, email, «скачать счёт».
- Пушить в `main`.

## Критерии приёмки

- Given каждый из трёх кабинетов выше, Then видна ровно своя фиксированная фраза.
- Given З-10043, Then шапка «КП готово» и подписи задачи 4 на месте.
- Red evidence есть до green.

## Проверки

```bash
pnpm --filter @client-portal/web test
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

Ветка `fix/ux-cabinet-next-step`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 6» → `docs/ux/task-06.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → `docs/decisions.md`. Не добавляй пятый статус.
