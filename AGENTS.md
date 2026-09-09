# Рабочее соглашение для LLM

Этот репозиторий — pnpm workspace на переносимом ядре (`@client-portal/platform-core`,
`nestjs-core`, `openapi-client-core`). Предметный продукт реализуй **только** по промпту
`docs/llm/feature-NN.md` в отдельном чате, один PR на фичу. Не копируй `apps/*` Вольтариса
и не добавляй mock-api. Работай небольшими проверяемыми изменениями.

## Приоритет источников

При конфликте применяй порядок сверху вниз:

1. новый явный prompt пользователя;
2. этот `AGENTS.md`;
3. `docs/decisions.md`;
4. нормализованные документы из `docs/README.md`.

Если новый prompt меняет контракт, зафиксируй решение в `docs/decisions.md`.

## Что читать

Всегда начни с этого файла, `docs/README.md` и `docs/implementation-status.md`. Карта
документов — в `docs/README.md`. Копируемый промпт фичи — `docs/llm/feature-NN.md`.

Skills в `.agents/skills/` — повседневные процедуры. Открой нужный skill в том же изменении:

- ядро и exports: `foundation-package-conventions`;
- слои Nest: `nestjs-hexagonal-boundaries`;
- ворота после изменения: `change-impact-gates`;
- внешний HTTP (когда продукт зовёт внешние системы): `outbound-http-adapters`;
- Prisma (когда появится схема): `prisma-persistence-boundary`;
- Nuxt (когда появится storefront): `nuxt-ssr-data-and-ui`;
- отчёт о проверках: `verification-honesty`;
- ветка и PR: `git-delivery`;
- ревью: `pr-review`;
- Docker ENOSPC: `docker-reclaim-space`.

Отдельного mock-процесса нет: skill `mock-http-boundary` не копировали. `mock-core` в
workspace нет и в production API не добавляй. Новый skill «tdd» не создавай: TDD описан
ниже и в `docs/testing.md`.

## Топология

Сейчас (фича 2 в поставке):

- pnpm workspace, Node 24.18 / pnpm 11;
- reusable packages: `tsconfig`, `eslint-config`, `platform-core`, `nestjs-core`,
  `openapi-client-core`;
- generated `packages/api-client` (`openapi.json` / `schema.d.ts` руками не править);
- `apps/api` — NestJS/Fastify, health, `GET /api/v1/demo/links` и
  `GET /api/v1/requests/{accessSecret}` (заявки в Postgres + seed);
- PostgreSQL в Docker (хост 5433), Prisma 7 в `apps/api`.

Целевая (по `docs/implementation-plan.md`, появляется фичами 3–8):

- `apps/web` — Nuxt 4, Tailwind v4 `@theme`, SSR через `useFetch`/`useAsyncData`;
- mock-api **нет и не появится**. «Система заявок» = Postgres + seed.

Ещё нет, пока соответствующая фича не в `main`: Nuxt, e2e.

Не добавляй Nx/Turborepo и не включай Nest monorepo mode. Не публикуй packages.

## Product scope

Демо канала статуса по не-SKU заявке ПК «Нордщит»: служебный список ссылок и кабинет
снаружи по секрету в URL (принят → в расчёте → КП → счёт). Зритель за 30 секунд должен
понять: заказчик видит шаг по ссылке, без кабинета с логином. Вымысел, не кейс и не
витрина Вольтариса.

Запрещено: каталог SKU, оптовый логин и роли, Integration Lab, чат, OTP, универсальная
шина заявок, оплата, CMS, брокер, Redis, Elasticsearch, Kubernetes, AI, mock-api.

Подробности: `docs/product-scope.md`, исходник — `docs/source-brief.md`.

## Границы кода

- Domain-less primitives — `@client-portal/platform-core`; Nest/Fastify plumbing —
  `@client-portal/nestjs-core`; generic OpenAPI transport —
  `@client-portal/openapi-client-core`. Не создавай локальные копии в приложениях.
- Общие packages не импортируют `apps/*`, Prisma, generated schema или домен продукта.
  Public imports — только declared subpath exports, не `src/` и не `dist/`.
- OpenAPI (когда появится) хранит server prefix `/api/v1` отдельно от относительных path
  keys.
- Controllers валидируют HTTP-ввод, вызывают application/use-case и формируют response.
  В них нет Prisma, внешнего mapping и business rules.
- Domain/application не зависит от Nest HTTP, Prisma и внешних DTO.
- Cross-context imports идут только через минимальный `public.ts` владельца.
- `pnpm check:boundaries` — отдельный gate; он не заменяется ESLint.
- Не используй `any`, необоснованный `@ts-ignore`, пустой `catch` или универсальный HTTP
  replay.
- Web не импортирует Prisma, DTO Nest, `apps/api`.

## Поставка в main

Каждое изменение после начального каркаса — feature-ветка, затем PR в `main`. В `main` не
пушить. Процедура — skill `git-delivery`.

## Рабочий цикл (TDD)

Тесты пишут **до** кода продукта, по приёмке, не по будущей реализации. Иначе агент
подгоняет assert под случайное поведение (false positive).

1. Проверь status и минимальный read set (`docs/llm/feature-NN.md`, этот файл, status).
2. Найди существующий контракт, pattern и тест до добавления нового.
3. Сформулируй проверяемый результат (AC) и ограничь impact surface.
4. Напиши targeted-тесты по AC. Запусти. Зафиксируй **red**: команда, exit ≠ 0, причина
   (нет маршрута, 404, нет текста). Если уже green — перепиши тесты так, чтобы они ловили
   отсутствие поведения.
5. Реализуй наименьшее полное изменение **на feature-ветке**, не на `main`, пока тесты не
   станут green. Не ослабляй assert, не `skip`/`xit`, не меняй ожидаемые значения «чтобы
   прошло».
6. Обнови затронутые DTO, schemas, client и docs.
7. Выполни применимые проверки (skill `change-impact-gates`) и запиши в
   `docs/implementation-status.md` **red-команду и green-команду**.
8. Открой PR в `main`; не пушь в `main`. После merge (или по просьбе) — skill `pr-review`
   отдельным шагом.

TDD обязателен для поведения, которое видит HTTP-клиент или зритель (ready, контракт
заявки, оба экрана, 404). Не требуется отдельный red для чисто docs/Prettier и для
generate-only артефактов после того, как контрактный тест уже red.

Не угадывай контракт. Версии сверяй с lockfile и официальной документацией. Lifecycle
стенда — цели корневого `Makefile` по факту файла (`bootstrap` / `dev` / `up` / `down` /
`verify`, когда они появятся). Не пиши агентам сырой `pnpm dev` / `docker compose`, кроме
skill.

## Проверка и честность отчета

Минимум — targeted tests изменённого поведения. Имена scripts сверяй с корневым
`package.json`. Сейчас применимы:

```bash
pnpm db:generate
pnpm generate:api
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`pnpm test:e2e` появится вместе с Playwright (фича 5). Не утверждай успех, если команда не
запускалась. Не пиши «должно работать».
