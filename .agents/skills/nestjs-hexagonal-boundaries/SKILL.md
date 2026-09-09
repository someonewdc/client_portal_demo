---
name: nestjs-hexagonal-boundaries
description: >-
  Applies modular-monolith NestJS layering from this core lineage: thin
  controllers, ports and Symbol tokens, useExisting adapters, public.ts
  cross-context APIs, typed application errors without Nest HTTP exceptions,
  and RFC 7807 Problem Details. Use when adding a module, use case, repository,
  HTTP mapping, or when reviewing layer/package/cross-context imports.
---

# NestJS hexagonal boundaries

Это overlay поверх generic Nest-навыков. Не добавляй Redis, BullMQ, worker, outbox или
error JSON `{ code, message }` по умолчанию: в этой линии внешние вызовы синхронны после
commit, ошибки наружу — Problem Details.

## Слои

```text
controller  →  application/use case  →  ports (Symbol tokens)
                 ↑                         ↓
            typed errors              infrastructure adapters
                 ↓                         ↓
         app-local HTTP map          Prisma / outbound HTTP
```

- Controller: class-validator DTO, whitelist, вызов use case, envelope. Нет Prisma, нет
  `fetch`, нет business rules.
- Application зависит от owned ports, не от concrete Prisma classes.
- Nest module: `{ provide: TOKEN, useExisting: Adapter }` — один instance на request, не
  `useClass` дважды.
- Domain/application не импортирует Nest HTTP, Prisma, внешние DTO, чужой `domain/*`.
- Mapping — чистые функции на границе infrastructure.
- Inbound: `ValidationPipe` `whitelist` + `forbidNonWhitelisted` + `transform`.
- Outbound JSON: Zod до записи в домен.

## Typed errors

Application кидает свои error classes **без** `HttpException` / status / DTO.

HTTP adapter (`map-application-error` или аналог) отображает их в Nest exceptions.
Unexpected остаётся 500 у `nestjs-core` Problem Details filter.

Наружу: RFC 7807 из `platform-core/problem-details` + Nest filter. Stack, SQL, Prisma,
secrets не сериализуются.

## Cross-context

Чужой context импортирует только минимальный `public.ts` владельца: types, tokens,
application services/ports. Не экспортируй DTO, Prisma types, controllers, adapters.

Внутри своего context прямые imports своих файлов допустимы. App-local public APIs не
выносятся в workspace packages.

После смены слоёв/exports: `pnpm check:boundaries`. Не расширяй allowlist без решения нового
продукта. Пустой allowlist — default этой линии (FH-4 исходного репо), не инвариант любого
`check-boundaries.mjs`.

## Do not

- Кидать `NotFoundException` из application.
- Импортировать `infrastructure/` чужого bounded context через обход `public.ts`.
- Держать второй logger/error format рядом с Problem Details.
