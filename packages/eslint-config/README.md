# `@client-portal/eslint-config`

Shared ESLint 9 flat config for this pnpm workspace: TypeScript recommended rules, Vue
`flat/recommended`, and a small project policy (`no-explicit-any`, consistent type imports,
restricted `console`).

Environment: Node.js tooling that already runs ESLint 9. ESM config file `index.mjs`.

## Public export

```js
import config from '@client-portal/eslint-config';

export default config;
```

The root workspace `eslint.config.mjs` re-exports this package. Ignore patterns cover
`dist`, `.nuxt`, generated Prisma/OpenAPI artifacts and reports.

## Peer expectations

Exact peers match the workspace lockfile. Do not widen them without checking ESLint 9 / Vue
plugin compatibility:

- `eslint`, `@eslint/js`: `9.39.5`
- `typescript-eslint`: `8.67.0`
- `eslint-plugin-vue`: `10.10.0`
- `vue-eslint-parser`: `10.4.1`
- `globals`: `17.9.0`

## Non-goals

- Replacing `pnpm check:boundaries` — architecture imports stay a separate gate
- Type-aware `no-deprecated` (that is the root `pnpm lint:deprecated` config)
- A universal UI lint kit or Prettier substitution

## Project-specific notes

Ignore paths mention this repository's Prisma/OpenAPI locations. Copy the config into another
workspace only after adjusting those ignores. Identity remains private `@client-portal/*@0.0.0`. See
[`docs/shared-core.md`](../../docs/shared-core.md).

Publication is out of scope until license, registry, versioning, ownership and changelog/release
policy are chosen. This package has no `LICENSE` or `publishConfig`.
