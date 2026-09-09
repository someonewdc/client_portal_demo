---
name: outbound-http-adapters
description: >-
  Implements outbound HTTP behind application ports: timeout, canonical
  correlation id, secret redaction, Zod success schemas, classified
  timeout/network/4xx/5xx, one journal row per physical attempt, persist then
  call, and domain retry instead of universal HTTP replay. Use when adding an
  external gateway, integration journal, or manual retry.
---

# Outbound HTTP adapters

Пакеты дают redaction и correlation. Оркестрацию пиши в приложении.

## Контур

```text
use case  →  commit business entity
          →  port
          →  HTTP adapter (timeout, X-Correlation-Id, Zod, classify)
          →  journal row per physical attempt
```

Каждый outbound request:

- timeout (в исходном ядре default 3000 ms — сверь с env продукта);
- canonical UUID в `X-Correlation-Id` из `platform-core/correlation-id`;
- secrets redact через `platform-core/json` до записи в journal/logs;
- Zod schema успешного тела до нормализации в домен;
- классификация: 2xx valid / 2xx invalid / 4xx / 5xx / timeout / network.

Одна journal row на **физическую** попытку, в том числе timeout. Не массив попыток внутри
одной row. Unique tuple в духе `(traceId, system, operation, attempt)`.

## Persist then integrate

Бизнес-сущность коммитится **до** внешних вызовов. Ошибка внешней системы её не откатывает.
Crash window после commit и до journal — известное ограничение, не повод добавлять Redis/outbox
без решения.

Automatic retry — только documented policy **этого** продукта (`docs/decisions.md`). Default
этой линии: initial attempt + максимум один retry на timeout/network/5xx. Не копируй имена
CRM/ERP/Notification и не выдумывай universal retry engine.

## Ручной retry

Доменная команда из устойчивого context. Gateway **заново** строит request. Endpoint не
принимает сохранённые method/URL/headers/body как инструкцию к replay.

## Do not

- Вызывать `fetch` из controller.
- Подменять provider 422/409 телом Problem Details основного API на mock-стороне
  (см. `mock-http-boundary`).
- Логировать bearer tokens.
