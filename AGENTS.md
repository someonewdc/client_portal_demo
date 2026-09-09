# Рабочее соглашение для LLM

Этот репозиторий — pnpm workspace на переносимом ядре (`@client-portal/platform-core`,
`nestjs-core`, `openapi-client-core`). Сейчас это **заготовка**, не продукт. Не начинай
предметный MVP (страница статуса заявки, Prisma, Nuxt, OpenAPI client), пока нет явного
prompt. Работай небольшими проверяемыми изменениями.

## Приоритет источников

При конфликте применяй порядок сверху вниз:

1. новый явный prompt пользователя;
2. этот `AGENTS.md`;
3. `docs/decisions.md`;
4. нормализованные документы из `docs/README.md`.

Если новый prompt меняет контракт, зафиксируй решение в `docs/decisions.md`.

## Что читать

Всегда начни с этого файла, `docs/README.md` и `docs/implementation-status.md`.

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

Отдельного mock-процесса нет: skill `mock-http-boundary` не копировали. `mock-core` в workspace
нет и в production API не добавляй.

## Топология сейчас

- pnpm workspace, Node 24.18 / pnpm 11;
- reusable packages: `tsconfig`, `eslint-config`, `platform-core`, `nestjs-core`,
  `openapi-client-core`;
- `apps/api` — NestJS/Fastify, только `GET /api/v1/health/live` и `/health/ready`.

Ещё нет: PostgreSQL/Prisma, Nuxt, generated `api-client`, mock-api.

Не добавляй Nx/Turborepo и не включай Nest monorepo mode. Не публикуй packages.

## Запланированный продукт (ещё не делать)

Клиентский канал статуса по не-SKU заявке: секрет в URL, этапы вроде «принят → в расчёте →
КП → счёт», файлы. Демо — вымысел, не кейс. Не копировать `apps/*` из Вольтариса.

В MVP запрещены: каталог SKU, оптовый кабинет с логином и ролями, Integration Lab, чат, OTP,
универсальная шина заявок, оплата, CMS, брокер, Redis, Elasticsearch, Kubernetes, AI.

## Границы кода

- Domain-less primitives — `@client-portal/platform-core`; Nest/Fastify plumbing —
  `@client-portal/nestjs-core`; generic OpenAPI transport —
  `@client-portal/openapi-client-core`. Не создавай локальные копии в приложениях.
- Общие packages не импортируют `apps/*`, Prisma, generated schema или домен продукта.
  Public imports — только declared subpath exports, не `src/` и не `dist/`.
- OpenAPI (когда появится) хранит server prefix `/api/v1` отдельно от относительных path keys.
- Controllers валидируют HTTP-ввод, вызывают application/use-case и формируют response.
  В них нет Prisma, внешнего mapping и business rules.
- Domain/application не зависит от Nest HTTP, Prisma и внешних DTO.
- Cross-context imports идут только через минимальный `public.ts` владельца.
- `pnpm check:boundaries` — отдельный gate; он не заменяется ESLint.
- Не используй `any`, необоснованный `@ts-ignore`, пустой `catch` или универсальный HTTP replay.

## Поставка в main

Каждое изменение после начального каркаса — feature-ветка, затем PR в `main`. В `main` не
пушить. Процедура — skill `git-delivery`.

## Рабочий цикл

1. Проверь status и минимальный read set.
2. Найди существующий контракт, pattern и тест до добавления нового.
3. Сформулируй проверяемый результат и ограничь impact surface.
4. Реализуй наименьшее полное изменение **на feature-ветке**, не на `main`.
5. Обнови затронутые DTO, schemas, client, tests и docs.
6. Выполни применимые проверки (skill `change-impact-gates`) и запиши факт в
   `docs/implementation-status.md`.
7. Открой PR в `main`; не пушь в `main`.

Не угадывай контракт. Версии сверяй с lockfile и официальной документацией.

## Проверка и честность отчета

Минимум — targeted tests изменённого поведения. Для этой заготовки применимы:

```bash
pnpm check:boundaries
pnpm lint
pnpm typecheck
pnpm test
pnpm test:packages
pnpm build
```

`pnpm generate:api` и `pnpm db:generate` появятся вместе с контрактом и Prisma. Не утверждай
успех, если команда не запускалась.
