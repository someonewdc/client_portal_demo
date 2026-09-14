# Черновик HTTP

Prefix на `servers[0].url` (`/api/v1`); path keys относительные. Руками
`packages/api-client/openapi.json` и `schema.d.ts` не править — только
`pnpm generate:api`.

Ошибки — RFC 7807. Нет `{ code, message }`. CORS: `GET`, `HEAD`, `OPTIONS` с
`WEB_ORIGIN`. Cookie заказчика нет.

## Уже есть после генератора

- `GET /health/live` → 200 `{ data: { status: "ok" }, meta: { traceId } }`
- `GET /health/ready` → 200 или 503 Problem Details без БД
- `GET /requests/{accessSecret}` → 200 кабинет или 404 Problem Details

Тела кабинета не содержат `demoLive`. Нет `/demo/links`, `/demo/conductor/…`.

Поля 200 кабинета (смысл, не копировать fixture Нордщита):

- `publicNumber`, `counterpartyName`, `title`, `status`, `statusLabel`,
  `updatedAt`
- `specLines[]`, `files[]` (в т.ч. `specLines` файла), `stages[]`
  (`id`, `label`, `reachedAt`)

Секрет — только path. Не логировать plaintext. Не класть секрет в `instance`
проблемы.

## Появятся по задачам (не раньше D-008)

Узкий **operator** контур (не заказчик):

- создать заявку (секрет один раз в ответе, дальше только hash);
- сдвинуть статус вперёд по ленте.

Это не пульт `/c/` и не cookie-логин. Заголовок или env-секрет оператора.
Заказчик эти маршруты не видит.

Нет в v1: PATCH универсальный, upload бинаря, POST от заказчика, login, OTP.
