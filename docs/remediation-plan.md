# План исправления дефектов

Вход оператора. Код здесь не пишут. Каждая задача — отдельный чат, одна
feature-ветка, один PR в `main` по `docs/llm/feature-NN.md`.

## Как запускать

В новом чате достаточно фразы:

```text
выполни задачу N
```

`N` — номер из колонки «Задача» ниже. Это полный вход: агент открывает указанный
`docs/llm/feature-NN.md` и больше ничего у тебя не спрашивает. Не скармливай прошлый
анализ и не уточняй scope.

UX/UI понятности — другой трек: [`ux/README.md`](ux/README.md). Вход туда:
`выполни ux задачу N` → `docs/ux/task-NN.md`. Фраза `выполни задачу N` без
`ux` по-прежнему только этот план (фичи 15–27).

Задача 0 (фича 14) — этот набор документов; её не запускай повторно после merge.

## Порядок

Фича N должна быть в `main` до старта N+1. Дополнительно D-034: задачу 11 (NuxtLink)
не начинать, пока задача 2 (реактивный портал) не в `main`.

```text
14 docs (D-030…D-035)
  → 15 decode param один раз
  → 16 reactive useRequestPortal (без NuxtLink)
  → 17 HTTP-статус HTML при ошибке API
  → 18 demo/links fail-closed на неполный каталог
  → 19 unique (requestId, fileName)
  → 20 заголовки Nuxt
  → 21 Cache-Control API
  → 22 CORS
  → 23 timeout OpenAPI-клиента
  → 24 throttle GET /requests/{secret}
  → 25 NuxtLink
  → 26 Dockerfile USER
  → 27 compose bind 127.0.0.1
```

## Таблица задач

| Задача | Фича | Промпт                                   | Слой     | Зачем                                         |
| ------ | ---- | ---------------------------------------- | -------- | --------------------------------------------- |
| 1      | 15   | [`llm/feature-15.md`](llm/feature-15.md) | web unit | Не декодировать `fileName` второй раз         |
| 2      | 16   | [`llm/feature-16.md`](llm/feature-16.md) | web      | Ключ/`watch` портала переживает смену URL     |
| 3      | 17   | [`llm/feature-17.md`](llm/feature-17.md) | web      | HTML-статус = ошибка API, не вечный 200       |
| 4      | 18   | [`llm/feature-18.md`](llm/feature-18.md) | api      | Нет всех пяти сидов → 500, не короткий список |
| 5      | 19   | [`llm/feature-19.md`](llm/feature-19.md) | prisma   | Имя файла уникально в заявке                  |
| 6      | 20   | [`llm/feature-20.md`](llm/feature-20.md) | nuxt     | no-store, no-referrer, noindex, DENY          |
| 7      | 21   | [`llm/feature-21.md`](llm/feature-21.md) | api      | no-store на capability JSON                   |
| 8      | 22   | [`llm/feature-22.md`](llm/feature-22.md) | api      | CORS только GET + localhost/127.0.0.1         |
| 9      | 23   | [`llm/feature-23.md`](llm/feature-23.md) | core     | Timeout SSR/fetch, чтобы не висеть вечно      |
| 10     | 24   | [`llm/feature-24.md`](llm/feature-24.md) | api      | In-memory throttle секрета, без Redis         |
| 11     | 25   | [`llm/feature-25.md`](llm/feature-25.md) | web      | `NuxtLink` после задачи 2                     |
| 12     | 26   | [`llm/feature-26.md`](llm/feature-26.md) | docker   | Процесс API/web не root                       |
| 13     | 27   | [`llm/feature-27.md`](llm/feature-27.md) | compose  | Порты стенда только на loopback               |

## Что сознательно не чиним

Зафиксировано в D-030. Агент задачи N не «доделывает» этот список:

- стабильные fixture-секреты сидов (D-008);
- открытый служебный `GET /demo/links` и индекс `/` без логина;
- HTTPS, Redis, `nuxt-security`, смена D-014;
- SWR/ISR на `/r/**`;
- пароль Postgres из D-017;
- CSP Helmet на JSON API;
- инварианты `status`↔`stageHistory` на чтении;
- `formatByteSize` для крошечных файлов;
- смена Vue `:key` на строках спеки/файлов.

## Решения

D-030 (нарезка), D-031 (каталог), D-032 (заголовки), D-033 (bind), D-034 (NuxtLink),
D-035 (unique fileName) — `docs/decisions.md`.
