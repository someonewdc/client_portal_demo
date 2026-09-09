# `@client-portal/tsconfig`

Shared TypeScript 5.9 compiler baselines for ESM workspaces.

Environment: TypeScript `5.9.x` with `module`/`moduleResolution` `NodeNext`. JSON configs only;
no runtime code.

## Public files

```json
{
  "extends": "@client-portal/tsconfig/base.json"
}
```

```json
{
  "extends": "@client-portal/tsconfig/nest.json"
}
```

| File        | Contract                                                                   |
| ----------- | -------------------------------------------------------------------------- |
| `base.json` | Strict ESM: `ES2023`, `verbatimModuleSyntax`, `exactOptionalPropertyTypes` |
| `nest.json` | Extends `base.json` with Nest decorator/declaration/sourceMap options      |

## Peer expectations

None. The consuming package provides `typescript`. Keep compiler options aligned with the
workspace `docs/toolchain.md` versions.

## Non-goals

- App-specific `paths`, Prisma generator options or Nuxt tsconfig
- Bundler `moduleResolution` profiles
- A second lint or test runner config

## Project-specific notes

Packages add their own `rootDir`/`outDir`/`include`. Identity remains private
`@client-portal/*@0.0.0`. Connect this package first in a new workspace; see
[`docs/shared-core.md`](../../docs/shared-core.md). Publication is out of scope until license, registry, versioning, ownership
and changelog/release policy are chosen. This package has no `LICENSE` or `publishConfig`.
