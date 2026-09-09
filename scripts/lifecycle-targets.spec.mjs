import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(resolve(rootDirectory, 'package.json'), 'utf8'));
const makefile = readFileSync(resolve(rootDirectory, 'Makefile'), 'utf8');

function makefileTarget(name) {
  const match = makefile.match(new RegExp(`^${name}:([^\\n]*)\\n((?:\\t.*\\n)*)`, 'm'));
  assert.ok(match, `missing ${name} target`);
  return { prerequisites: match[1].trim(), recipe: match[2] };
}

describe('feature 1 lifecycle targets', () => {
  it('declares db:generate, db:migrate and db:seed in the root package', () => {
    assert.equal(typeof packageJson.scripts['db:generate'], 'string');
    assert.equal(typeof packageJson.scripts['db:migrate'], 'string');
    assert.equal(typeof packageJson.scripts['db:seed'], 'string');
  });

  it('declares Makefile targets up, down, dev and verify', () => {
    assert.match(makefile, /^up:/m);
    assert.match(makefile, /^down:/m);
    assert.match(makefile, /^dev:/m);
    assert.match(makefile, /^verify:/m);
  });

  it('verify brings up Postgres and migrates before root gates', () => {
    const verify = makefileTarget('verify');
    assert.equal(verify.prerequisites, 'up');
    assert.match(verify.recipe, /^\tpnpm db:generate$/m);
    assert.match(verify.recipe, /^\tpnpm db:migrate$/m);
  });

  it('exposes Postgres on host 5433 without api or web compose services', () => {
    const compose = readFileSync(resolve(rootDirectory, 'compose.yaml'), 'utf8');
    assert.match(compose, /5433:5432/);
    assert.match(compose, /client-portal-/);
    assert.doesNotMatch(compose, /^ {2}api:/m);
    assert.doesNotMatch(compose, /^ {2}web:/m);
  });
});

describe('feature 2 generate:api', () => {
  it('declares generate:api in the root package', () => {
    assert.equal(typeof packageJson.scripts['generate:api'], 'string');
  });

  it('verify generates the OpenAPI client after migrate', () => {
    const verify = makefileTarget('verify');
    assert.match(verify.recipe, /^\tpnpm generate:api$/m);
  });

  it('pins openapi-typescript in the api-client lockfile instead of pnpm dlx', () => {
    const apiClientPackage = JSON.parse(
      readFileSync(resolve(rootDirectory, 'packages/api-client/package.json'), 'utf8'),
    );
    assert.equal(apiClientPackage.devDependencies['openapi-typescript'], '7.13.0');
    assert.equal(typeof apiClientPackage.scripts.generate, 'string');
    assert.doesNotMatch(apiClientPackage.scripts.generate, /pnpm dlx/);
    assert.match(apiClientPackage.scripts.generate, /openapi-typescript/);
  });

  it('verify and CI fail when generated OpenAPI drifts from the commit', () => {
    const verify = makefileTarget('verify');
    const ci = readFileSync(resolve(rootDirectory, '.github/workflows/ci.yml'), 'utf8');
    const generatedDiff =
      'git diff --exit-code -- packages/api-client/openapi.json packages/api-client/src/schema.d.ts';
    assert.match(verify.recipe, new RegExp(`^\\t${generatedDiff.replaceAll(' ', '\\s+')}$`, 'm'));
    assert.match(
      ci,
      /git diff --exit-code -- packages\/api-client\/openapi.json packages\/api-client\/src\/schema.d.ts/,
    );
  });

  it('resolves one @nestjs/config instance for api and nestjs-core', () => {
    const apiRequire = createRequire(resolve(rootDirectory, 'apps/api/package.json'));
    const coreRequire = createRequire(resolve(rootDirectory, 'packages/nestjs-core/package.json'));
    assert.equal(apiRequire.resolve('@nestjs/config'), coreRequire.resolve('@nestjs/config'));
  });
});
