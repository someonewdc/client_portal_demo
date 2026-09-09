# `@client-portal/nestjs-core`

Domain-less NestJS 11 / Fastify 5 plumbing: correlated adapter, logging, strict validation,
Problem Details filter and shared OpenAPI DTO. It depends inward on `@client-portal/platform-core`
and does not import applications, Prisma or generated project schema.

Environment: Node.js `>=24.11.0 <25`, ESM only. Host apps own CORS, uploads, rate limits,
readiness probes and Swagger title/composition.

## Public exports

```ts
import { createCorrelatedFastifyAdapter } from '@client-portal/nestjs-core/bootstrap';
import { PlatformLoggingModule } from '@client-portal/nestjs-core/logging';
import { provideProblemDetailsFilter } from '@client-portal/nestjs-core/problem-details';
import { createGlobalValidationPipe } from '@client-portal/nestjs-core/validation';
import { TraceMetaDto } from '@client-portal/nestjs-core/openapi';

const adapter = createCorrelatedFastifyAdapter();
```

| Export             | Contract                                                                       |
| ------------------ | ------------------------------------------------------------------------------ |
| `/bootstrap`       | Correlated Fastify adapter, Helmet, validation pipe and shutdown hooks         |
| `/logging`         | `nestjs-pino` dynamic module with safe request serializer and secret redaction |
| `/validation`      | Strict `ValidationPipe` policy and typed per-DTO pipe                          |
| `/problem-details` | Nest filter/logging over pure `platform-core/problem-details`                  |
| `/openapi`         | `TraceMetaDto`, `ProblemDetailsDto` and documented rate-limit response         |

## Dependencies and peers

Package-owned runtime: `@client-portal/platform-core`, `@fastify/helmet`, `nestjs-pino`, `pino`,
`pino-pretty`.

Host-owned Nest/Fastify stack is declared as peer dependencies. Ranges follow NestJS 11 /
`@nestjs/config` 4 / Fastify 5 compatibility used by this workspace:

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify`: `^11.0.0`
- `@nestjs/swagger`: `^11.0.0`
- `@nestjs/config`: `^4.0.0`
- `fastify`: `^5.0.0`
- `reflect-metadata`: `^0.1.12 || ^0.2.0`
- `rxjs`: `^7.1.0`

The host also needs `class-validator` / `class-transformer` for `ValidationPipe` at runtime.
They are not re-declared here because Nest treats them as optional peers of `@nestjs/common`.

Do not copy these peers into a looser `*` range. Pin the host to versions that satisfy the
declared ranges and the workspace lockfile.

## Non-goals

- Product modules, Prisma repositories or application error vocabulary
- Universal access-control, retry engine or health controllers
- App-specific CORS, multipart limits, route rate limits or Swagger metadata

## Project-specific notes

Workspace identity is private `@client-portal/*@0.0.0`. Pass product defaults through the app
composition root. To take this package into a new Nest workspace, follow
[`docs/shared-core.md`](../../docs/shared-core.md). Publication is out of scope until license, registry, versioning, ownership
and changelog/release policy are chosen. This package has no `LICENSE` or `publishConfig`.
