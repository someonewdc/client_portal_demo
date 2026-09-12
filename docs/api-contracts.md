# Черновик HTTP-контракта

Prefix живёт на server URL, path keys относительные. После появления `pnpm generate:api`:
`servers[0].url` содержит `/api/v1`; клиент не повторяет prefix в path. Руками
`packages/api-client/openapi.json` и `schema.d.ts` не править.

Уже есть в заготовке (не ломать):

- `GET /health/live` → 200 `{ data: { status: "ok" }, meta: { traceId } }`
- `GET /health/ready` → 200 то же; 503 Problem Details, если процесс не принимает трафик
  (фича 1: также если нет БД)

Ошибки наружу — RFC 7807 из `nestjs-core` / `platform-core/problem-details`. Нет
`{ code, message }`.

## `GET /demo/links`

Служебный список для индексной страницы демо. Это не кабинет заказчика и не админка
менеджера.

200:

```json
{
  "data": {
    "items": [
      {
        "publicNumber": "З-10041",
        "counterpartyName": "ООО «Северэнергомонтаж»",
        "title": "Щит ЩО-70 800 А",
        "status": "accepted",
        "statusLabel": "Принят",
        "portalPath": "/r/seed-z10041-accepted-severenergo",
        "updatedAt": "2026-09-01T10:00:00.000Z"
      }
    ]
  },
  "meta": { "traceId": "…" }
}
```

`portalPath` уже содержит секрет — ведущий кликает, не копирует ссылку вручную. Это **тело
ответа**, не лог. Не писать секрет/`portalPath` отдельным полем приложения (D-014).

Порядок: стабильный, по `publicNumber` по возрастанию.

500 Problem Details (`RequestFixtureMismatchError`, не 4xx): неизвестный хеш (D-019)
или в БД нет всех пяти `publicNumber` каталога, включая пустую таблицу (D-031; код —
фича 18). Успех — ровно каталог 1:1, не усечённый список.

## `GET /requests/{accessSecret}`

Кабинет одной заявки. `{accessSecret}` — plaintext fixture/CSPRNG token, не хеш.

200:

```json
{
  "data": {
    "publicNumber": "З-10043",
    "counterpartyName": "ИП Кузнецов П.А.",
    "title": "ВРУ 400 А",
    "status": "quote_ready",
    "statusLabel": "КП готово",
    "updatedAt": "2026-09-04T12:00:00.000Z",
    "plantName": "ПК «Нордщит»",
    "stages": [
      { "status": "accepted", "label": "Принят", "reachedAt": "2026-09-01T09:00:00.000Z" },
      { "status": "in_calculation", "label": "В расчёте", "reachedAt": "2026-09-02T11:00:00.000Z" },
      { "status": "quote_ready", "label": "КП готово", "reachedAt": "2026-09-04T12:00:00.000Z" },
      { "status": "invoice_issued", "label": "Счёт выставлен", "reachedAt": null }
    ],
    "specLines": [
      {
        "name": "Вводно-распределительное устройство 400 А",
        "quantity": 1,
        "unit": "шт",
        "comment": "IP54, навесное"
      },
      {
        "name": "Рубильник ввода",
        "quantity": 1,
        "unit": "шт"
      }
    ],
    "files": [
      {
        "fileName": "Опросный-лист-З-10043.pdf",
        "kind": "questionnaire",
        "byteSize": 120400,
        "uploadedAt": "2026-09-01T09:05:00.000Z"
      },
      {
        "fileName": "КП-З-10043.pdf",
        "kind": "quote",
        "byteSize": 240000,
        "uploadedAt": "2026-09-04T12:00:00.000Z"
      }
    ]
  },
  "meta": { "traceId": "…" }
}
```

`stages` всегда четыре элемента в каноническом порядке. `reachedAt: null` — шаг ещё не
наступил.

Поля `title`, `specLines`, `files`, `updatedAt` и fixture-секрет — 1:1 из каталога
`docs/domain-model.md`. Пример выше — З-10043 из этого каталога, не образец для выдумки.

## 404

Неизвестный или пустой секрет, заявка не найдена по хешу:

- HTTP 404
- Problem Details: `title` в духе «Resource not found»; `detail` без SQL, stack и без
  plaintext секрета; `traceId` есть
- `instance` и access-лог **могут** содержать path с секретом (D-014)
- Web рисует тупик, не форму входа

Несуществующий path API — тот же Problem Details filter, не HTML login.

## 429

Перебор `GET /requests/{accessSecret}` с одного IP: 60 запросов / 60 секунд
(in-memory, без Redis). Ключ — IP пира API, не path и не секрет.

- HTTP 429, `application/problem+json`
- `title` «Too many requests»; `detail` без SQL, stack, plaintext секрета и без имени
  библиотеки throttler
- `Retry-After` — секунды до повтора
- `GET /demo/links` и health (`/health/live`, `/health/ready`) этот лимит не применяют
- Tracker — `request.ip` процесса API (`trustProxy` выключен, D-026): браузерный GET на
  `:3001` считается по IP клиента; SSR из контейнера `web` на `http://api:3001` делит
  один бакет на first-load стенда

## Вне контракта MVP

Нет POST/PATCH статусов, upload файлов, auth headers, OTP, списка «всех заявок» кроме
`/demo/links`.
