# Рабочее соглашение для LLM

Этот репозиторий — **клиентская страница заявки Protostar**: заказчик завода
открывает длинную ссылку и видит, на каком шаге не‑SKU заявка (щит / комплект /
«под заказ»). Это не маркетинговый сайт `protostar.ru`, не демо «Вольтарис» и не
театр ПК «Нордщит».

Слово «витрина» здесь значит **витрина статуса** (оффер сентября 2026), не
каталог SKU и не оптовый кабинет.

Предметный код пиши **только** по `docs/llm/task-NN.md` в отдельном чате, один PR
на задачу. Оператор: `реализуй задачу N`. Фраза `спроектируй продукт` — только
документы, без `apps/*`. Не копируй `apps/*` Вольтариса, Нордщита и `protostar_site`.
Mock-api не добавляй.

## Приоритет источников

1. новый явный prompt пользователя;
2. этот `AGENTS.md`;
3. `docs/decisions.md`;
4. документы из `docs/README.md`;
5. исходник `docs/source-brief.md` (не переписывать «удобнее коду»).

Если новый prompt меняет контракт — новая строка в `docs/decisions.md`, следующий
свободный ID.

## Что читать

Всегда начни с этого файла, `docs/README.md` и `docs/implementation-status.md`.
Карта — `docs/README.md`. Копируемый промпт — `docs/llm/task-NN.md`.

Skills в `.agents/skills/` (открывай нужный в том же изменении):

- ядро и exports: `foundation-package-conventions`;
- слои Nest: `nestjs-hexagonal-boundaries`;
- ворота: `change-impact-gates`;
- Prisma: `prisma-persistence-boundary`;
- Nuxt: `nuxt-ssr-data-and-ui`;
- отчёт: `verification-honesty`;
- ветка и PR: `git-delivery`;
- Docker ENOSPC: `docker-reclaim-space`.

Skills `github-remote`, `pr-review`, `implement-review-cycle` в dest **нет**
(генератор их не копировал). Не выдумывай их. GitHub writes — `gh` с
`required_permissions: ["all"]`, пока skills не перенесёте сами.

Не создавай skill «tdd»: TDD описан ниже и в `docs/testing.md`.

## Топология

- pnpm workspace, Node 24 / pnpm 11;
- packages: `@protostar/platform-core`, `nestjs-core`, `openapi-client-core`,
  `tsconfig`, `eslint-config`, generated `api-client`;
- `apps/api` — NestJS/Fastify, health, `GET /api/v1/requests/{accessSecret}`;
- `apps/web` — Nuxt, кабинет `/r/{secret}` и лист `/r/{secret}/d/{fileName}`;
  индекс `/` — заглушка, не список ссылок для показа;
- стенд: `make up` / `make dev` — web `:3100`, api `:3101`, Postgres хост `:5434`.
  Порты `3000` / `3001` / `5433` заняты Нордщитом и Вольтарисом — не трогать.

Seed после генератора — no-op. Живых заявок нет, пока не сделана задача 1.

## Product scope

Покупатель Protostar — владелец / коммерческий / РОП щитового завода. Зритель
страницы — **его** заказчик по ссылке из мессенджера. За 30 секунд: заявка жива,
шаг «принят → в расчёте → КП → счёт», файлы списком. Логина нет.

Запрещено: каталог SKU, корзина, оптовые роли, Integration Lab, чат, OTP, 1С как
ядро, универсальная шина заявок, оплата, CMS, Redis, Elasticsearch, Kubernetes,
AI-парсер схем, mock-api, театр `/demo/links` `/start` `/c/`, копирование
Вольтариса и Нордщита.

Подробности: `docs/product-scope.md`. Исходник — `docs/source-brief.md`.

Соседние git (не этот):

| Репозиторий          | Роль                                                |
| -------------------- | --------------------------------------------------- |
| `protostar_site`     | лендинг Astro, `protostar.ru`                       |
| `demo_b2b`           | вымысел «Вольтарис», `demo.` / `show.`              |
| `client_portal_demo` | демо-театр Нордщита для продажи; не продукт клиента |

Публичный hostname этой страницы — решение D-002 (`status.protostar.ru`), не path
на apex.

## Границы кода

- Domain-less primitives — `@protostar/platform-core`; Nest plumbing —
  `@protostar/nestjs-core`; OpenAPI transport — `@protostar/openapi-client-core`.
- Общие packages не импортируют `apps/*`, Prisma, generated schema или домен.
- Controllers валидируют HTTP, зовут use-case, отдают response. В них нет Prisma
  и business rules.
- Domain/application не зависит от Nest HTTP, Prisma и внешних DTO.
- Web не импортирует Prisma, DTO Nest, `apps/api`.
- `pnpm check:boundaries` — отдельный gate.
- Не используй `any`, пустой `catch`, cookie-сессию заказчика.

## Поставка в main

Feature-ветка, PR в `main`. В `main` не пушить. Skill `git-delivery`.

## Рабочий цикл (TDD)

Тесты пишут **до** кода продукта, по приёмке.

1. Status и read set промпта задачи.
2. Существующий контракт и тест.
3. AC и узкий impact.
4. Targeted-тесты. Зафиксируй **red**.
5. Минимальный green на feature-ветке. Не ослабляй assert.
6. DTO, OpenAPI, client, docs.
7. Ворота `change-impact-gates`. Journal в `docs/implementation-status.md`.
8. PR в `main`.

TDD обязателен для HTTP и экранов заказчика.

## Проверка

Имена scripts — корневой `package.json`. Не утверждай успех без запуска.

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

Playwright в dest нет. Не пиши `pnpm test:e2e`.

## Операторы

| Фраза                 | Что открывает                                                           |
| --------------------- | ----------------------------------------------------------------------- |
| `спроектируй продукт` | только `docs/*`, без `apps/*`                                           |
| `реализуй задачу N`   | `docs/llm/task-NN.md`, один PR                                          |
| `посмотри ревью`      | ревью открытого PR (skills ревью в dest нет — смотри diff и CI вручную) |

Не открывают этот репозиторий: `выполни фичу N`, `выполни ux задачу N`,
`реализуй вынос ядра` — это фразы Нордщита.
