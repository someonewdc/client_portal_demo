# Доменная модель

Одна не-SKU заявка ПК «Нордщит». Нет пользователя, роли и сессии: доступ — знание секрета.

## Заявка

Поля, которые видит кабинет и/или индекс:

- `publicNumber` — человекочитаемый номер, например `З-10041`.
- `counterpartyName` — вымышленное ЮЛ/ИП.
- `title` — краткое имя заказа (щит / НКУ / комплект), не SKU.
- `status` — текущий шаг enum ниже.
- `updatedAt` — момент последнего изменения заявки.
- `specLines` — **ровно** 2–5 строк спецификации: `name`, `quantity` (integer), `unit`,
  необязательный `comment`. Это не корзина каталога и не типы цен. Каталог сидов ниже —
  источник правды: не выдумывать другие title/строки.
- `files` — метаданные вложений: `fileName`, `kind` (`questionnaire` / `quote` / `invoice`),
  `byteSize` (integer), `uploadedAt`, `specLines` (2–5 строк того документа: `name`, `quantity`,
  `unit`, необязательный `comment`). Бинарников и загрузки с диска нет. В UI имя открывает
  HTML-лист `/r/{accessSecret}/d/{fileName}` (D-029); таблица листа — `files[].specLines`
  (D-054), не `request.specLines`. В одной заявке `fileName` уникален (D-035; код — фича 19).
- `stageHistory` — когда заявка достигла каждого пройденного статуса (для ленты штампов).
- `demoLive` — только в HTTP кабинета: явное `true` у З-10046; у каталожных пяти поля нет
  (D-050). Не колонка «логин».

Внутренние поля (не в кабинете как «логин»):

- `id` — суррогат.
- `accessSecretHash` — SHA-256 hex от opaque-секрета (`hashOpaqueToken`). Уникален.
- plaintext секрета в БД нет.

Денежные суммы в MVP не обязательны. Если появятся — integer minor units, не float
(`prisma-persistence-boundary`).

## Статусы

Линейная лента, четыре значения. API enum — латиница; подписи на экране — русский.

| Enum             | Подпись        |
| ---------------- | -------------- |
| `accepted`       | Принят         |
| `in_calculation` | В расчёте      |
| `quote_ready`    | КП готово      |
| `invoice_issued` | Счёт выставлен |

Текущий статус — последний достигнутый. Лента показывает все четыре штампа: пройден /
текущий / ещё нет. Не канбан и не произвольный граф. В HTTP `stages` всегда четыре элемента
в этом порядке; будущие шаги — `reachedAt: null`.

## Секрет

- Алфавит как у `generateOpaqueToken()`: base64url `[A-Za-z0-9_-]`.
- Lookup: `hashOpaqueToken(secret)` → уникальный индекс.
- Секрет — capability одной заявки, не идентификатор пользователя.
- Сиды используют **стабильные** fixture-секреты (не CSPRNG на каждый seed), чтобы e2e не
  плавал. Значения в каталоге ниже.
- Path, логи и `instance` — `docs/decisions.md` D-014.

Кабинет: `http://localhost:3000/r/{accessSecret}`. HTML-лист файла:
`http://localhost:3000/r/{accessSecret}/d/{fileName}` (D-029).
Вход зрителя live: `http://localhost:3000/start`. Пульт ведущего:
`http://localhost:3000/c/{conductorSecret}` (секрет пульта — env, не поле заявки).

## Сиды (5 каталожных + 1 живая)

Источник правды для фичи 2, e2e и live-сценария. Не менять `publicNumber`, `title`,
`accessSecret`, состав `specLines` и `fileName` **каталога пяти**. Seed идемпотентен
на предназначенной dev-БД: upsert пяти каталожных номеров **и** З-10046, удаление
строк вне этого набора (D-019, D-050). Не генерировать новый секрет при повторном
`db:seed`. Повторный seed сбрасывает З-10046 к `accepted`.

`GET /demo/links` отдаёт **только** пять каталожных. З-10046 в `items` нет.

Сводка каталога (индекс):

| publicNumber | Контрагент              | status           | accessSecret (fixture)             |
| ------------ | ----------------------- | ---------------- | ---------------------------------- |
| З-10041      | ООО «Северэнергомонтаж» | `accepted`       | `seed-z10041-accepted-severenergo` |
| З-10042      | АО «ПортЛайн»           | `in_calculation` | `seed-z10042-calc-portline`        |
| З-10043      | ИП Кузнецов П.А.        | `quote_ready`    | `seed-z10043-quote-kuznetsov`      |
| З-10044      | ООО «Теплицы Поволжья»  | `invoice_issued` | `seed-z10044-invoice-teplitsy`     |
| З-10045      | ЗАО «Горсвет»           | `in_calculation` | `seed-z10045-calc-gorsvet`         |

### З-10041

- `title`: `Щит ЩО-70 800 А`
- `updatedAt`: `2026-09-01T10:00:00.000Z`
- `stages.reachedAt`: `accepted` `2026-09-01T09:00:00.000Z`; остальные `null`
- `specLines`:
  1. `name` `Щит ЩО-70 800 А IP54`, `quantity` `1`, `unit` `шт`, `comment` `навесной`
  2. `name` `Комплект автоматики ввода`, `quantity` `1`, `unit` `шт`
- `files`:
  - `fileName` `Опросный-лист-З-10041.pdf`, `kind` `questionnaire`, `byteSize` `98000`,
    `uploadedAt` `2026-09-01T09:05:00.000Z`; `specLines` = `specLines` заявки

### З-10042

- `title`: `НКУ освещения причала`
- `updatedAt`: `2026-09-02T11:00:00.000Z`
- `stages.reachedAt`: `accepted` `2026-09-01T09:00:00.000Z`; `in_calculation`
  `2026-09-02T11:00:00.000Z`; остальные `null`
- `specLines`:
  1. `name` `НКУ освещения причала`, `quantity` `1`, `unit` `шт`
  2. `name` `Шкаф учёта`, `quantity` `2`, `unit` `шт`
- `files`:
  - `fileName` `Опросный-лист-З-10042.pdf`, `kind` `questionnaire`, `byteSize` `102000`,
    `uploadedAt` `2026-09-01T09:10:00.000Z`; `specLines` = `specLines` заявки

### З-10043

- `title`: `ВРУ 400 А`
- `updatedAt`: `2026-09-04T12:00:00.000Z`
- `stages.reachedAt`: `accepted` `2026-09-01T09:00:00.000Z`; `in_calculation`
  `2026-09-02T11:00:00.000Z`; `quote_ready` `2026-09-04T12:00:00.000Z`; `invoice_issued`
  `null`
- `specLines`:
  1. `name` `Вводно-распределительное устройство 400 А`, `quantity` `1`, `unit` `шт`,
     `comment` `IP54, навесное`
  2. `name` `Рубильник ввода`, `quantity` `1`, `unit` `шт`
- `files`:
  - `fileName` `Опросный-лист-З-10043.pdf`, `kind` `questionnaire`, `byteSize` `120400`,
    `uploadedAt` `2026-09-01T09:05:00.000Z`; `specLines`:
    1. `name` `ВРУ 400 А`, `quantity` `1`, `unit` `шт`, `comment` `опросный лист`
    2. `name` `Учёт на вводе`, `quantity` `1`, `unit` `шт`
  - `fileName` `КП-З-10043.pdf`, `kind` `quote`, `byteSize` `240000`, `uploadedAt`
    `2026-09-04T12:00:00.000Z`; `specLines` = `specLines` заявки

### З-10044

- `title`: `Щит управления теплицами`
- `updatedAt`: `2026-09-06T15:00:00.000Z`
- `stages.reachedAt`: `accepted` `2026-09-01T09:00:00.000Z`; `in_calculation`
  `2026-09-02T11:00:00.000Z`; `quote_ready` `2026-09-04T12:00:00.000Z`; `invoice_issued`
  `2026-09-06T15:00:00.000Z`
- `specLines`:
  1. `name` `Щит управления теплицами`, `quantity` `1`, `unit` `комплект`
  2. `name` `Шкаф частотников`, `quantity` `1`, `unit` `шт`
- `files`:
  - `fileName` `Опросный-лист-З-10044.pdf`, `kind` `questionnaire`, `byteSize` `110000`,
    `uploadedAt` `2026-09-01T09:05:00.000Z`; `specLines`:
    1. `name` `Щит управления теплицами`, `quantity` `1`, `unit` `шт`, `comment` `IP54`
    2. `name` `Частотники полива`, `quantity` `3`, `unit` `шт`
  - `fileName` `КП-З-10044.pdf`, `kind` `quote`, `byteSize` `256000`, `uploadedAt`
    `2026-09-04T12:00:00.000Z`; `specLines`:
    1. `name` `Щит управления теплицами`, `quantity` `1`, `unit` `комплект`
    2. `name` `Шкаф частотников`, `quantity` `1`, `unit` `шт`
    3. `name` `Пульт диспетчера`, `quantity` `1`, `unit` `шт`
  - `fileName` `Счёт-З-10044.pdf`, `kind` `invoice`, `byteSize` `180000`, `uploadedAt`
    `2026-09-06T15:00:00.000Z`; `specLines` = `specLines` заявки

### З-10045

- `title`: `Шкафы наружного освещения`
- `updatedAt`: `2026-09-03T14:00:00.000Z`
- `stages.reachedAt`: `accepted` `2026-09-01T09:00:00.000Z`; `in_calculation`
  `2026-09-03T14:00:00.000Z`; остальные `null`
- `specLines`:
  1. `name` `Шкаф управления наружным освещением`, `quantity` `3`, `unit` `шт`
  2. `name` `Блок учёта`, `quantity` `1`, `unit` `шт`
- `files`:
  - `fileName` `Опросный-лист-З-10045.pdf`, `kind` `questionnaire`, `byteSize` `99000`,
    `uploadedAt` `2026-09-01T09:20:00.000Z`; `specLines` = `specLines` заявки

## Живая заявка З-10046 (не в `/demo/links`)

Не член каталога индекса. Fixture стенда, код — фича 29. Не выдумывать другие поля.

- `publicNumber`: `З-10046`
- `counterpartyName`: `ООО «Северная дуга»`
- `title`: `Щит ЩО-70 показа`
- `accessSecret`: `seed-z10046-live-severnaya-duga`
- после seed/reset: `accepted`
- `specLines`:
  1. `name` `Щит ЩО-70 800 А IP54`, `quantity` `1`, `unit` `шт`, `comment` `навесной, показ`
  2. `name` `Комплект автоматики ввода`, `quantity` `1`, `unit` `шт`
- файлы (метаданные, появляются по шагу, D-052; состав строк — D-054):
  - `accepted`: `fileName` `Опросный-лист-З-10046.pdf`, `kind` `questionnaire`,
    `byteSize` `100000`; `specLines`:
    1. `name` `Щит ЩО-70 800 А IP54`, `quantity` `1`, `unit` `шт`, `comment` `навесной`
    2. `name` `АВР на вводе`, `quantity` `1`, `unit` `комплект`
  - `quote_ready`: + `КП-З-10046.pdf`, `kind` `quote`, `byteSize` `240000`; `specLines`:
    1. `name` `Щит ЩО-70 800 А IP54`, `quantity` `1`, `unit` `шт`
    2. `name` `Комплект автоматики ввода`, `quantity` `1`, `unit` `шт`
    3. `name` `Рубильник ввода`, `quantity` `1`, `unit` `шт`
  - `invoice_issued`: + `Счёт-З-10046.pdf`, `kind` `invoice`, `byteSize` `180000`; `specLines`:
    1. `name` `Щит ЩО-70 800 А IP54`, `quantity` `1`, `unit` `шт`, `comment` `к оплате, показ`
    2. `name` `Комплект автоматики ввода`, `quantity` `1`, `unit` `шт`
- Даты — `now()` стенда, не замороженные ISO каталога пяти. В тестах F30: `reachedAt`
  не null у пройденных, порядок, не равенство конкретной дате.
- `GET /requests/{accessSecret}`: `demoLive: true`. У пяти каталожных поля нет.
