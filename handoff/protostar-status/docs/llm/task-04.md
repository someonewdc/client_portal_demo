# Реализуй задачу 4: hostname status.protostar.ru

## Цель

Хостовый nginx (репозиторий **`protostar_site`**, не этот git) публикует этот
стенд как sibling `status.protostar.ru`, по тому же канону, что demo/show:
один nginx, TLS, `/` → web, `/api/v1/` → API loopback. Apex Astro не трогать.

## Блокер

D-002 закрыт и совпадает с `status.protostar.ru` (или оператор явно назвал
другое имя — тогда правь эту задачу, не угадывай).

## Где работать

Чат открыт в `protostar_site`. Этот промпт копируют туда или ссылаются. Код
`apps/*` dest не менять, кроме `WEB_ORIGIN` / CORS под HTTPS, если D-002 уже
на стенде.

Следовать `protostar_site/docs/host-nginx-spec.md`: не класть nginx в Compose
этого git, не проксировать apex сюда, не публиковать Postgres, `Host` и
`X-Forwarded-Proto` как у overlay.

## Не делать

Cutover «live готов» без DNS/TLS/HTTP 200. Ссылки с лендинга до 200. Path
`/portal` на `protostar.ru`. Копирование `staging.conf` Вольтариса as-is.

## Приёмка

`GET https://status.protostar.ru/api/v1/health/live` → 200. Кабинет по секрету
открывается с того же origin. `GET https://protostar.ru/` по-прежнему Astro.
`www` по-прежнему 301 на apex. Нет 403 на status (это не show-allowlist).
