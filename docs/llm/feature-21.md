# Реализуй задачу 7 / фичу 21: Cache-Control на capability JSON

Пользователь написал «выполни задачу 7». Этот файл — полный вход. Другой контекст
не нужен.

## Цель

`GET /api/v1/demo/links` и `GET /api/v1/requests/{accessSecret}` отдают
`Cache-Control: private, no-store`. Health не трогать.

## Зависимости

Фичи 1–20 в `main`. Фичи 22–27 не начинать.

## Read set

- `AGENTS.md`
- `docs/README.md`, `docs/implementation-status.md`
- `docs/decisions.md` (D-012, D-014, D-030, D-032)
- `docs/testing.md`
- `.agents/skills/git-delivery/SKILL.md`
- `.agents/skills/change-impact-gates/SKILL.md`
- `.agents/skills/nestjs-hexagonal-boundaries/SKILL.md`
- `.agents/skills/verification-honesty/SKILL.md`
- `apps/api/src/requests/http/demo-links.controller.ts`
- `apps/api/src/requests/http/request-portal.controller.ts`
- `apps/api/src/requests/requests.http.spec.ts`
- `apps/api/src/health/health.http.spec.ts`

## Контекст продукта

Тело `/demo/links` содержит `portalPath` с секретом. Кабинетный JSON — та же
capability. Shared cache не должен хранить ответ. D-014 не менять.

## Стек и границы

- App-local: interceptor, декоратор или `@Header` **только** на двух GET выше.
  Не клади product header в `nestjs-core`, если нет второго consumer.
- Значение буквально: `private, no-store`.
- `GET /health/live` и `GET /health/ready` без этого требования.
- OpenAPI можно не расширять (заголовок ответа не в контракте экрана). Не гоняй
  `generate:api`, если document не менялся.

## TDD (red до header)

1. `pnpm --filter @client-portal/api exec vitest run src/requests/requests.http.spec.ts`:
   200 `/demo/links` и 200 `/requests/seed-z10043-quote-kuznetsov` —
   `headers['cache-control']` содержит `no-store` и `private`.
   404 неизвестного секрета — тот же Cache-Control (чтобы негатив не кэшировали).
   Текущий main — **red**.
2. Поставь заголовок на оба контроллерных метода (и на 404 через тот же путь
   ответа / interceptor, если 404 идёт через filter — допустимо повесить hook
   Fastify `onSend` только для prefix `/api/v1/demo` и `/api/v1/requests`).
3. Health spec не должен требовать `no-store`. Не ломай его.
4. Если сразу green — перепиши assert. Не `skip`/`xit`.

## Что не делать

- Менять Nuxt (уже фича 20), CORS, throttle, D-014 serializer.
- Redis.
- Пушить в `main`.

## Критерии приёмки

- Given 200/404 capability JSON, Then `Cache-Control: private, no-store`.
- Given health, Then контракт F1 без нового cache-требования.
- Red evidence есть до green.

## Проверки

```bash
pnpm --filter @client-portal/api exec vitest run src/requests/requests.http.spec.ts src/health/health.http.spec.ts
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

Обнови `docs/implementation-status.md` (red и green).

## Git

Ветка `fix/api-capability-cache-control`, PR в `main`. Skill `git-delivery`.

## После merge

Skill `pr-review`. Дальше: «выполни задачу 8» → `docs/llm/feature-22.md`.

## Честность отчёта

Выполнено / проверено / не проверено / заблокировано. Red и green обязательны.

## Стоп

Неоднозначность → D-032. Не включай write-методы в этот PR.
