# Реализуй задачу 13 / фичу 27: порты стенда только на loopback

Пользователь написал «выполни задачу 13». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

Опубликованные порты Compose слушают `127.0.0.1`, не `0.0.0.0`. Номера портов
D-006 не менять. Контейнеры по-прежнему видят друг друга по именам сервисов.

## Зависимости

Фичи 1–26 в `main`.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-006, D-012, D-016, D-017, D-018, D-030, D-033)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `compose.yaml`
- `scripts/lifecycle-targets.spec.mjs`
- `scripts/compose-smoke.mjs`
- `.github/workflows/ci.yml` (e2e ходит на localhost — должен остаться валидным)

## Контекст продукта

Один стенд на машине ведущего. LAN-доступ к `:3000`/`:5433` с соседнего телефона
больше не цель. CI runner использует `localhost`. Запрещено: Kubernetes, смена
номеров портов, пароля Postgres.

## Стек и границы

- [`compose.yaml`](../../compose.yaml) `ports`:
  - `127.0.0.1:5433:5432`
  - `127.0.0.1:3001:3001`
  - `127.0.0.1:3000:3000`
- Не менять `container_name`, healthcheck, `NUXT_*`, `DATABASE_URL` внутри сети.
- Makefile цели не переименовывать.

## TDD (red до compose)

1. `node --test scripts/lifecycle-targets.spec.mjs`: в `compose.yaml` есть три
   строки bind `127.0.0.1:` на 3000, 3001, 5433 и нет короткой формы `'3000:3000'`
   / `'3001:3001'` / `'5433:5432'` без host. Текущий main — **red**.
2. Правка `compose.yaml`.
3. `make up` + `node scripts/compose-smoke.mjs` + при возможности `pnpm test:e2e`.
   Нет Docker — **не проверено**, не выдумывай.
4. Если lifecycle сразу green — перепиши assert. Не `skip`/`xit`.

## Что не делать

- Менять D-006 номера портов.
- Bind хостовых `pnpm dev` процессов (не compose).
- Закрывать inter-service DNS `api` / `postgres`.
- Пушить в `main`.

## Критерии приёмки

- Given `compose.yaml`, Then published ports только `127.0.0.1`.
- Given CI/localhost, Then `http://localhost:3000` и `:3001`/`:5433` живы.
- Red evidence lifecycle есть до green.

## Проверки

```bash
node --test scripts/lifecycle-targets.spec.mjs
pnpm format
pnpm format:check
git diff --check
```

Compose-smoke / e2e — если запускал, запиши команды. Обнови
`docs/implementation-status.md`.

## Git

Ветка `fix/compose-loopback-bind`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Это последняя задача нарезки D-030.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано.

## Стоп

Неоднозначность → D-033. Не публикуй Postgres наружу «для удобства Studio».
