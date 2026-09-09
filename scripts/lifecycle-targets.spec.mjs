import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(resolve(rootDirectory, 'package.json'), 'utf8'));
const makefile = readFileSync(resolve(rootDirectory, 'Makefile'), 'utf8');

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

  it('exposes Postgres on host 5433 without api or web compose services', () => {
    const compose = readFileSync(resolve(rootDirectory, 'compose.yaml'), 'utf8');
    assert.match(compose, /5433:5432/);
    assert.match(compose, /client-portal-/);
    assert.doesNotMatch(compose, /^ {2}api:/m);
    assert.doesNotMatch(compose, /^ {2}web:/m);
  });
});
