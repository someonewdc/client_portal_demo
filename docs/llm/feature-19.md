# Реализуй задачу 5 / фичу 19: уникальное имя файла в заявке

Пользователь написал «выполни задачу 5». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

В БД два вложения одной заявки не могут иметь одно `fileName`. Каталог сидов уже
уникален — состав не менять.

## Зависимости

Фичи 1–18 в `main`. Фичи 20–27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-010, D-012, D-030, D-035)
- `docs/domain-model.md` (files)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/prisma-persistence-boundary/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/`
- `apps/api/src/requests/requests.http.spec.ts` (стиль information_schema)
- `apps/api/src/requests/infrastructure/apply-request-seed.ts`

## Контекст продукта

ПК «Нордщит». Лист файла ищет метаданные по `fileName`. Дубль имени ломает `:key` и
`find`. Запрещено: upload, бинарники, новые файлы в каталоге, mock-api.

## Стек и границы

- Prisma 7: `RequestFile` `@@unique([requestId, fileName])`. Индекс `requestId`
  можно оставить.
- Новая forward-only migration. Применённый SQL не редактировать.
- Seed не менять (имена уже уникальны в заявке).
- OpenAPI / Vue / envelope не менять.
- После schema: `pnpm db:generate`, `pnpm db:migrate` на предназначенной dev-БД
  (хост 5433 / как в `.env`).

## TDD (red до schema)

1. HTTP/integration it в `requests.http.spec.ts` (или соседний spec): через
   `information_schema` / `pg_indexes` доказать unique на
   `("requestId","fileName")` у `RequestFile`. Текущий main — **red**.
2. Schema + migration + `pnpm db:generate` + `pnpm db:migrate`.
3. Существующие seed/HTTP тесты З-10043 остаются green. Не ослабляй их.
4. Если сразу green — перепиши assert. Не `skip`/`xit`. Не `migrate reset` на
   неизвестном volume.

## Что не делать

- Менять `fileName` сидов, OpenAPI, web.
- Destructive reset чужой БД.
- Пушить в `main`.

## Критерии приёмки

- Given schema, Then `@@unique([requestId, fileName])` и migration в репозитории.
- Given повторный seed, Then пять заявок как в каталоге.
- Given GET З-10043, Then те же два файла.
- Red evidence есть до green.

## Проверки

```bash
pnpm db:generate
pnpm db:migrate
pnpm --filter @client-portal/api exec vitest run src/requests/requests.http.spec.ts
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

Обнови `docs/implementation-status.md` (red и green).

## Git

Ветка `fix/request-file-name-unique`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 6» → `docs/llm/feature-20.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-035. Не добавляй upload и не правь applied migration.
