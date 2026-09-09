import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
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

const forbiddenCssToolchain = /^(?:postcss|tailwindcss|@tailwindcss\/|@nuxtjs\/tailwindcss$)/;
const webSourceExtensions = new Set(['.ts', '.mts', '.js', '.mjs', '.vue']);
const skippedWebDirectories = new Set(['.nuxt', '.output', 'dist', 'node_modules']);

function workspaceManifests() {
  const manifests = [{ path: 'package.json', json: packageJson }];

  for (const group of ['apps', 'packages']) {
    const groupDirectory = resolve(rootDirectory, group);
    if (!existsSync(groupDirectory)) {
      continue;
    }

    for (const entry of readdirSync(groupDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const path = `${group}/${entry.name}/package.json`;
      const absolutePath = resolve(rootDirectory, path);
      if (existsSync(absolutePath)) {
        manifests.push({ path, json: JSON.parse(readFileSync(absolutePath, 'utf8')) });
      }
    }
  }

  return manifests;
}

function listedDependencies(manifest) {
  return {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.optionalDependencies,
    ...manifest.peerDependencies,
  };
}

function listWebSourceFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!skippedWebDirectories.has(entry.name)) {
        files.push(...listWebSourceFiles(absolutePath));
      }
      continue;
    }

    const extension = entry.name.slice(entry.name.lastIndexOf('.'));
    if (webSourceExtensions.has(extension)) {
      files.push(absolutePath);
    }
  }

  return files;
}

describe('feature 3 nuxt workspace', () => {
  it('includes apps/web in recursive typecheck and build', () => {
    const webPackagePath = resolve(rootDirectory, 'apps/web/package.json');
    assert.equal(existsSync(webPackagePath), true, 'apps/web/package.json must exist');

    const webPackage = JSON.parse(readFileSync(webPackagePath, 'utf8'));
    assert.equal(webPackage.name, '@client-portal/web');
    assert.match(packageJson.scripts.typecheck, /pnpm -r /);
    assert.match(packageJson.scripts.build, /pnpm -r /);
    assert.equal(typeof webPackage.scripts.typecheck, 'string');
    assert.equal(typeof webPackage.scripts.build, 'string');
    assert.match(webPackage.scripts.typecheck, /\bnuxt typecheck\b/);
    assert.match(webPackage.scripts.build, /\bnuxt build\b/);
    assert.equal(typeof webPackage.dependencies?.nuxt, 'string');
    assert.match(webPackage.dependencies.nuxt, /^4\./);
  });

  it('make dev starts web on :3000 alongside db and api', () => {
    const dev = makefileTarget('dev');
    const webPackagePath = resolve(rootDirectory, 'apps/web/package.json');
    assert.equal(existsSync(webPackagePath), true, 'apps/web/package.json must exist');
    const webPackage = JSON.parse(readFileSync(webPackagePath, 'utf8'));

    assert.equal(dev.prerequisites, 'up');
    assert.match(dev.recipe, /^\tpnpm db:generate$/m);
    assert.match(dev.recipe, /^\tpnpm db:migrate$/m);
    assert.match(dev.recipe, /^\tpnpm db:seed$/m);
    assert.match(dev.recipe, /^\tpnpm dev$/m);
    assert.match(makefile, /@client-portal\/web/);
    assert.match(`${dev.recipe}\n${packageJson.scripts.dev}`, /@client-portal\/web/);
    assert.match(`${dev.recipe}\n${packageJson.scripts.dev}`, /@client-portal\/api/);
    assert.match(webPackage.scripts.dev, /\bnuxt dev\b/);
    assert.match(webPackage.scripts.dev, /--port[ =]3000/);
  });

  it('does not add Tailwind, PostCSS or a root test:e2e script', () => {
    assert.equal(packageJson.scripts['test:e2e'], undefined);

    for (const { path, json } of workspaceManifests()) {
      for (const name of Object.keys(listedDependencies(json))) {
        assert.equal(forbiddenCssToolchain.test(name), false, `${path} must not depend on ${name}`);
      }
    }
  });

  it('keeps the web stub free of API lists, cabinet data and api-client facade', () => {
    const webRoot = resolve(rootDirectory, 'apps/web');
    assert.equal(existsSync(webRoot), true, 'apps/web must exist');

    const sourceFiles = listWebSourceFiles(webRoot);
    assert.ok(sourceFiles.length > 0, 'apps/web must contain source files');

    const sources = sourceFiles.map((absolutePath) => ({
      path: relative(rootDirectory, absolutePath).replaceAll('\\', '/'),
      source: readFileSync(absolutePath, 'utf8'),
    }));
    const combined = sources.map(({ source }) => source).join('\n');
    const indexPage = sources.find((file) => file.path.endsWith('/pages/index.vue'));

    assert.ok(indexPage, 'apps/web must have a / pages/index.vue stub');
    assert.match(indexPage.source, /Нордщит/);
    assert.doesNotMatch(indexPage.source, /Принят|В расчёте|КП готово|Счёт выставлен/);
    assert.doesNotMatch(combined, /createApiClient|createProblemAwareClient/);
    assert.doesNotMatch(combined, /@client-portal\/api-client/);
    assert.doesNotMatch(combined, /@prisma\/client|@nestjs\/|apps\/api/);
    assert.doesNotMatch(combined, /\/demo\/links/);
    assert.equal(
      sources.some((file) => /\/pages\/r\//.test(file.path)),
      false,
      'cabinet route /r/{secret} belongs to a later feature',
    );
  });
});
