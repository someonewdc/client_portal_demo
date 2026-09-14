# Реализуй задачу 1: пример заявки на кабинете

## Цель

В dest появляется **одна** идемпотентная seed-заявка. Кабинет `/r/{secret}`
показывает её заказчику завода. Это артефакт к письму Protostar, не театр
Нордщита и не каталог Вольтариса.

## Блокер

D-004 в `docs/decisions.md` должен быть **закрыт** в том же PR или ранее:
`publicNumber`, `counterpartyName`, `title`, стабильный `accessSecret`, состав
`specLines` и `fileName`. Если D-004 открыт — не пиши код, спроси оператора.

## Read set

`AGENTS.md`, `docs/README.md`, `docs/implementation-status.md`,
`docs/product-scope.md`, `docs/domain-model.md`, `docs/api-contracts.md`,
`docs/frontend.md`, `docs/decisions.md`, `docs/testing.md`,
skill `nestjs-hexagonal-boundaries`, `prisma-persistence-boundary`,
`nuxt-ssr-data-and-ui`, `change-impact-gates`, `verification-honesty`,
`git-delivery`. Существующие `GET /requests/{accessSecret}`, Prisma schema,
seed no-op, web tests kit C.

## TDD

Тесты до кода. Red: пустая БД / no-op seed → кабинет 404 или пустой контракт.
Не копируй fixture `З-1004*` / `seed-z100*`. Не `skip`.

## Сделать

- Seed одной заявки, upsert по `publicNumber`, без `deleteMany` «каталога пяти».
- HTTP 200 кабинета совпадает с D-004. Нет `demoLive`.
- Индекс `/` по-прежнему без списка заявок.
- Journal red/green в `docs/implementation-status.md`.
- PR в `main`.

## Не делать

Вольтарис, Нордщит-театр, `/demo/links`, операторский write (задача 3), nginx
(задача 4), upload бинаря, логин, суммы оплаты, смена D-001 шрифтов.

## Приёмка

Given seed, When `GET /api/v1/requests/{accessSecret}`, Then 200 с полями D-004
и лентой из четырёх stages. Given другой секрет, Then 404 Problem Details.
Given `/r/{secret}` на `:3100`, Then номер и штампы видны, кнопок статуса нет.
