# `@client-portal/openapi-client-core`

Generic `openapi-fetch` transport with correlation headers and RFC 7807 error conversion. The
package is parameterized by the caller's `Paths` type and does not import a generated project
schema.

Environment: Node.js `>=24.11.0 <25` or any runtime with `fetch` and `URL`. ESM only.

## Public export

```ts
import {
  createProblemAwareClient,
  ApiProblemError,
  ApiNetworkError,
} from '@client-portal/openapi-client-core';

interface Paths {
  '/health/live': {
    get: { responses: { 200: { content: { 'application/json': { status: string } } } } };
  };
}

const client = createProblemAwareClient<Paths>('https://api.example.test/api/v1');
```

The root export wraps `openapi-fetch`: adds/checks `X-Correlation-Id` through
`platform-core/correlation-id`, normalizes the base URL, converts Problem Details responses into
`ApiProblemError` via pure `isProblemDetails`, and distinguishes network failures as
`ApiNetworkError`. `ProblemDetails` / `ProblemFieldError` are re-exported from
`platform-core/problem-details`.

## Dependencies

- `@client-portal/platform-core`
- `openapi-fetch`

The host supplies the generated `Paths` type. Do not import this project's `packages/api-client`
schema into another product.

## Non-goals

- Generated OpenAPI types, product DTO or Nuxt cookie/SSR/CSRF forwarding
- A second Problem Details type system — the pure contract lives in `platform-core`
- Browser-specific session policy

## Project-specific notes

This workspace generates `@client-portal/api-client` `Paths` from the product OpenAPI.
Do not copy that schema into another product. The runtime facade over this transport is
added with the storefront (feature 3). Workspace identity is private `@client-portal/*@0.0.0`.
See [`docs/shared-core.md`](../../docs/shared-core.md).

Publication is out of scope until license, registry, versioning, ownership and changelog/release
policy are chosen. This package has no `LICENSE` or `publishConfig`.
