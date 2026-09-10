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
  `byteSize` (integer), `uploadedAt`. Бинарников и загрузки с диска нет. В UI имя открывает
  HTML-лист `/r/{accessSecret}/d/{fileName}` (D-029), не download. В одной заявке
  `fileName` уникален (D-035; код — фича 19).
- `stageHistory` — когда заявка достигла каждого пройденного статуса (для ленты штампов).

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

## Сиды (5 заявок)

Источник правды для фичи 2 и e2e. Не менять `publicNumber`, `title`, `accessSecret`,
состав `specLines` и `fileName`. Seed идемпотентен на предназначенной dev-БД и приводит
таблицу заявок к этому каталогу: upsert пяти номеров и удаление строк вне каталога
(D-019). Не генерировать новый секрет при повторном `db:seed`.

Сводка:

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
    `uploadedAt` `2026-09-01T09:05:00.000Z`

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
    `uploadedAt` `2026-09-01T09:10:00.000Z`

### З-10043

- `title`: `ВРУ 400 А`
- `updatedAt`: `2026-09-04T12:00:00.000Z`
- `stages.reachedAt`: `accepted` `2026-09-01T09:00:00.000Z`; `in_calculation`
  `2026-09-02T11:00:00.000Z`; `quote_ready` `2026-09-04T12:00:00.000Z`; `invoice_issued`
  `null`
- `specLines`:
  1. `name` `Вводно-распределительное устройство 400 А`, `quantity` `1`, `unit` `шт`,
     `comment` `IP54, навесной`
  2. `name` `Рубильник ввода`, `quantity` `1`, `unit` `шт`
- `files`:
  - `fileName` `Опросный-лист-З-10043.pdf`, `kind` `questionnaire`, `byteSize` `120400`,
    `uploadedAt` `2026-09-01T09:05:00.000Z`
  - `fileName` `КП-З-10043.pdf`, `kind` `quote`, `byteSize` `240000`, `uploadedAt`
    `2026-09-04T12:00:00.000Z`

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
    `uploadedAt` `2026-09-01T09:05:00.000Z`
  - `fileName` `КП-З-10044.pdf`, `kind` `quote`, `byteSize` `256000`, `uploadedAt`
    `2026-09-04T12:00:00.000Z`
  - `fileName` `Счёт-З-10044.pdf`, `kind` `invoice`, `byteSize` `180000`, `uploadedAt`
    `2026-09-06T15:00:00.000Z`

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
    `uploadedAt` `2026-09-01T09:20:00.000Z`
