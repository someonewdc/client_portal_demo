# `@client-portal/platform-core`

Domain-less cross-runtime primitives for Node ESM workspaces. The package does not depend on
NestJS, Fastify, Vue, Nuxt, Prisma or a generated OpenAPI schema.

Environment: Node.js `>=24.11.0 <25`, ESM only. There is no root barrel; import declared subpaths.

## Public exports

```ts
import {
  CORRELATION_ID_HEADER,
  resolveCorrelationId,
} from '@client-portal/platform-core/correlation-id';
import {
  validateEnvironment,
  nodeEnvironmentSchema,
} from '@client-portal/platform-core/environment';
import { resolveFeatureFlags } from '@client-portal/platform-core/feature-flags';
import { serializeHttpRequest } from '@client-portal/platform-core/http';
import { generateOpaqueToken, hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { hasAllPermissions } from '@client-portal/platform-core/permissions';
import {
  PROBLEM_DETAILS_MEDIA_TYPE,
  isProblemDetails,
} from '@client-portal/platform-core/problem-details';
import { normalizeIntegerInput } from '@client-portal/platform-core/input';
import { redactJsonObject } from '@client-portal/platform-core/json';
import { exactHttpBaseUrlSchema } from '@client-portal/platform-core/url';

resolveCorrelationId(undefined); // canonical UUID
exactHttpBaseUrlSchema('/api/v1').parse('https://api.example.test/api/v1');
```

| Export             | Contract                                                          |
| ------------------ | ----------------------------------------------------------------- |
| `/correlation-id`  | Canonical `X-Correlation-Id` constants, validation and generation |
| `/environment`     | Shared Zod env schemas and fail-fast validation                   |
| `/feature-flags`   | Generic typed profile resolver without project feature names      |
| `/http`            | Safe request serializer and bounded JSON response reader          |
| `/opaque-token`    | CSPRNG token, SHA-256 hash and constant-time comparison           |
| `/permissions`     | Bounded permission-code validation and set algebra                |
| `/problem-details` | RFC 7807-style types, media type and strict `isProblemDetails`    |
| `/input`           | Integer string normalization into a closed range                  |
| `/json`            | JSON guards, secret redaction and bounded UI-safe values          |
| `/url`             | Exact HTTP(S) base URL schema without credentials/query/fragment  |

## Dependencies

Runtime dependency: `zod`. Consumers do not need Nest or a frontend framework.

## Non-goals

- Catalog, RFQ, ERP/CRM/Notification or other product vocabulary
- Nest HTTP filters, OpenAPI DTO or Prisma types
- Process-local mock stores — those live in `@client-portal/mock-core`
- A universal application framework or root utility barrel

## Project-specific notes

Workspace identity is private `@client-portal/*@0.0.0`. Replace the scope only after choosing a new
one. Product defaults stay in the consuming composition root. To take this package into a new
workspace without copying `apps/*`, follow [`docs/shared-core.md`](../../docs/shared-core.md).

Publication is out of scope until license, registry, versioning, ownership and changelog/release
policy are chosen. This package has no `LICENSE` or `publishConfig`.
