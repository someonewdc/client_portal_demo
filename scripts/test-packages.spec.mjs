import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  describeTarballEntry,
  isAllowedTarballEntry,
  isRepoPackagePath,
  publicImportSpecifiers,
  tarballPathViolation,
} from './test-packages.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('reusable package packing allowlist', () => {
  it('allows compiled dist artifacts, README and package.json', () => {
    assert.equal(isAllowedTarballEntry('compiled', 'package/package.json'), true);
    assert.equal(isAllowedTarballEntry('compiled', 'package/README.md'), true);
    assert.equal(isAllowedTarballEntry('compiled', 'package/dist/correlation-id.js'), true);
    assert.equal(isAllowedTarballEntry('compiled', 'package/dist/correlation-id.d.ts'), true);
    assert.equal(isAllowedTarballEntry('compiled', 'package/dist/correlation-id.js.map'), true);
  });

  it('allows eslint and tsconfig public files', () => {
    assert.equal(isAllowedTarballEntry('eslint', 'package/index.mjs'), true);
    assert.equal(isAllowedTarballEntry('json', 'package/base.json'), true);
    assert.equal(isAllowedTarballEntry('json', 'package/nest.json'), true);
  });

  it('rejects source, tests, apps, secrets and generated schema', () => {
    assert.equal(tarballPathViolation('package/src/index.ts'), 'source-directory');
    assert.equal(tarballPathViolation('package/src/idempotency.spec.ts'), 'source-directory');
    assert.equal(tarballPathViolation('package/dist/example.spec.js'), 'tests');
    assert.equal(tarballPathViolation('package/apps/api/src/main.ts'), 'app-source');
    assert.equal(tarballPathViolation('package/.env'), 'secrets');
    assert.equal(tarballPathViolation('package/src/schema.d.ts'), 'source-directory');
    assert.equal(tarballPathViolation('package/schema.d.ts'), 'generated-project-schema');
    assert.equal(tarballPathViolation('package/dist/.tsbuildinfo'), 'build-cache');
    assert.equal(isAllowedTarballEntry('compiled', 'package/src/index.ts'), false);
    assert.equal(isAllowedTarballEntry('compiled', 'package/AGENTS.md'), false);
  });

  it('rejects unexpected extra artifacts even when they are not forbidden paths', () => {
    const extra = describeTarballEntry('compiled', 'package/vitest.config.ts');
    assert.equal(extra.allowed, false);
    assert.equal(extra.reason, 'unexpected-artifact');
    assert.equal(isAllowedTarballEntry('json', 'package/index.mjs'), false);
  });

  it('detects workspace package paths and listed public specifiers', () => {
    assert.equal(isRepoPackagePath(resolve(repoRoot, 'packages/platform-core'), repoRoot), true);
    assert.equal(
      isRepoPackagePath(
        '/tmp/client-portal-package-smoke/consumer/node_modules/@client-portal/platform-core',
        repoRoot,
      ),
      false,
    );
    assert.deepEqual(
      publicImportSpecifiers({
        name: '@client-portal/platform-core',
        exports: { './json': {}, './url': {} },
      }),
      ['@client-portal/platform-core/json', '@client-portal/platform-core/url'],
    );
    assert.deepEqual(
      publicImportSpecifiers({ name: '@client-portal/openapi-client-core', exports: { '.': {} } }),
      ['@client-portal/openapi-client-core'],
    );
  });
});
