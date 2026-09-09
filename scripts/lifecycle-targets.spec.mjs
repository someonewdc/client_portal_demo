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

const forbiddenLegacyCssToolchain = /^(?:postcss|@tailwindcss\/postcss$|@nuxtjs\/tailwindcss$)/;
const webSourceExtensions = new Set(['.ts', '.mts', '.js', '.mjs', '.vue']);
const webFileExtensions = new Set([...webSourceExtensions, '.css']);
const skippedWebDirectories = new Set(['.nuxt', '.output', 'dist', 'node_modules']);
const frontendThemeColors = {
  '--color-paper': '#f4f1ea',
  '--color-sheet': '#fffcf7',
  '--color-ink': '#1c1917',
  '--color-ink-muted': '#5c564e',
  '--color-accent': '#3d5a73',
  '--color-rule': '#d6d0c4',
};
const webRoot = resolve(rootDirectory, 'apps/web');

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

function listWebFiles(directory, extensions = webSourceExtensions) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!skippedWebDirectories.has(entry.name)) {
        files.push(...listWebFiles(absolutePath, extensions));
      }
      continue;
    }

    const extension = entry.name.slice(entry.name.lastIndexOf('.'));
    if (extensions.has(extension)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function listWebSourceFiles(directory) {
  return listWebFiles(directory, webSourceExtensions);
}

function webRelative(absolutePath) {
  return relative(rootDirectory, absolutePath).replaceAll('\\', '/');
}

function resolveWebSpecifier(specifier, fromFile) {
  if (specifier.startsWith('~/') || specifier.startsWith('@/')) {
    return resolve(webRoot, 'app', specifier.slice(2));
  }

  if (specifier.startsWith('.')) {
    return resolve(dirname(fromFile), specifier);
  }

  return null;
}

function cssSpecifiersFromSource(source) {
  const specifiers = [
    ...source.matchAll(/(?:@import|import)\s+['"]([^'"]+\.css)['"]/g),
    ...source.matchAll(/from\s+['"]([^'"]+\.css)['"]/g),
  ];
  return specifiers.map((match) => match[1]);
}

function nuxtCssEntries(nuxtConfigSource) {
  const block = nuxtConfigSource.match(/css:\s*\[([\s\S]*?)\]/);
  if (!block) {
    return [];
  }

  return [...block[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function collectCssGraph(entryPath, seen = new Set()) {
  if (seen.has(entryPath) || !existsSync(entryPath)) {
    return [];
  }

  seen.add(entryPath);
  const source = readFileSync(entryPath, 'utf8');
  const files = [{ path: entryPath, source }];

  for (const specifier of cssSpecifiersFromSource(source)) {
    const resolved = resolveWebSpecifier(specifier, entryPath);
    if (resolved) {
      files.push(...collectCssGraph(resolved, seen));
    }
  }

  return files;
}

function wiredCssGraph(nuxtConfigSource, layoutSources) {
  const entries = [
    ...nuxtCssEntries(nuxtConfigSource).map((specifier) =>
      resolveWebSpecifier(specifier, resolve(webRoot, 'nuxt.config.ts')),
    ),
    ...layoutSources.flatMap((file) =>
      cssSpecifiersFromSource(file.source).map((specifier) =>
        resolveWebSpecifier(specifier, file.path),
      ),
    ),
  ].filter((path) => typeof path === 'string');

  const seen = new Set();
  return entries.flatMap((path) => collectCssGraph(path, seen));
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

  it('does not add a root test:e2e script', () => {
    assert.equal(packageJson.scripts['test:e2e'], undefined);
  });

  it('keeps the web stub free of API lists, cabinet data and api-client facade', () => {
    assert.equal(existsSync(webRoot), true, 'apps/web must exist');

    const sourceFiles = listWebSourceFiles(webRoot);
    assert.ok(sourceFiles.length > 0, 'apps/web must contain source files');

    const sources = sourceFiles.map((absolutePath) => ({
      path: webRelative(absolutePath),
      source: readFileSync(absolutePath, 'utf8'),
    }));
    const combined = sources.map(({ source }) => source).join('\n');
    const indexPage = sources.find((file) => file.path.endsWith('/pages/index.vue'));

    assert.ok(indexPage, 'apps/web must have a / pages/index.vue stub');
    assert.match(indexPage.source, /Каркас клиентского канала статуса/);
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

describe('feature 4 tokens and document layout', () => {
  const webPackagePath = resolve(webRoot, 'package.json');
  const nuxtConfigPath = resolve(webRoot, 'nuxt.config.ts');

  function webPackageJson() {
    return JSON.parse(readFileSync(webPackagePath, 'utf8'));
  }

  function nuxtConfigSource() {
    return readFileSync(nuxtConfigPath, 'utf8');
  }

  function vueSources() {
    return listWebSourceFiles(webRoot)
      .filter((absolutePath) => absolutePath.endsWith('.vue'))
      .map((absolutePath) => ({
        path: webRelative(absolutePath),
        source: readFileSync(absolutePath, 'utf8'),
      }));
  }

  function layoutSources() {
    return vueSources().filter((file) => /\/layouts\/[^/]+\.vue$/.test(file.path));
  }

  it('installs Tailwind v4 through the official Nuxt Vite plugin and keeps test:e2e out', () => {
    const webPackage = webPackageJson();

    assert.match(String(webPackage.dependencies?.tailwindcss ?? ''), /^4\./);
    assert.match(String(webPackage.dependencies?.['@tailwindcss/vite'] ?? ''), /^4\./);
    assert.match(nuxtConfigSource(), /from ['"]@tailwindcss\/vite['"]/);
    assert.match(nuxtConfigSource(), /tailwindcss\(\s*\)/);
    assert.equal(packageJson.scripts['test:e2e'], undefined);

    for (const { path, json } of workspaceManifests()) {
      for (const name of Object.keys(listedDependencies(json))) {
        assert.equal(
          forbiddenLegacyCssToolchain.test(name),
          false,
          `${path} must not depend on ${name}`,
        );

        if (path !== 'apps/web/package.json') {
          assert.equal(
            /^(?:tailwindcss|@tailwindcss\/)/.test(name),
            false,
            `${path} must not depend on ${name}`,
          );
        }
      }
    }
  });

  it('wires frontend.md @theme tokens through imported CSS, not a dead file', () => {
    const layouts = layoutSources();
    const graph = wiredCssGraph(nuxtConfigSource(), layouts);
    assert.ok(
      graph.length > 0,
      'hex tokens must live in CSS imported from nuxt.config or a layout, not an unwired file',
    );

    const combined = graph.map((file) => file.source).join('\n');
    assert.match(combined, /@theme\b/);

    for (const [token, hex] of Object.entries(frontendThemeColors)) {
      assert.match(
        combined,
        new RegExp(`${token.replaceAll('-', '\\-')}:\\s*${hex}`),
        `wired CSS must declare ${token}: ${hex}`,
      );
    }

    const documentWidth = combined.match(/--container-document:\s*([\d.]+)rem/);
    assert.ok(documentWidth, 'wired @theme must declare --container-document');
    const rem = Number(documentWidth[1]);
    assert.equal(Number.isNaN(rem), false);
    assert.ok(rem >= 40 && rem <= 42, `--container-document must be 40–42rem, got ${rem}`);
  });

  it('loads IBM Plex Sans from @fontsource/ibm-plex-sans with cyrillic, not Google Fonts', () => {
    const webPackage = webPackageJson();
    assert.equal(typeof webPackage.dependencies?.['@fontsource/ibm-plex-sans'], 'string');

    const combined = wiredCssGraph(nuxtConfigSource(), layoutSources())
      .map((file) => file.source)
      .join('\n');
    assert.match(combined, /@fontsource\/ibm-plex-sans/);
    assert.match(combined, /cyrillic/);
    assert.match(combined, /--font-sans:[^;]*IBM Plex Sans/);

    const allFiles = listWebFiles(webRoot, webFileExtensions).map((absolutePath) =>
      readFileSync(absolutePath, 'utf8'),
    );
    assert.doesNotMatch(allFiles.join('\n'), /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });

  it('renders the plant header from a layout component with a document column token', () => {
    const appVue = vueSources().find((file) => file.path.endsWith('/app/app.vue'));
    assert.ok(appVue, 'apps/web/app/app.vue must exist');
    assert.match(appVue.source, /<NuxtLayout[\s>]/);

    const layouts = layoutSources();
    assert.ok(
      layouts.length > 0,
      'header must live in a Vue layout component, not only pages/index',
    );

    const headerLayout = layouts.find(
      (file) => /<header[\s>]/.test(file.source) && /ПК «Нордщит»/.test(file.source),
    );
    assert.ok(headerLayout, 'layout component must render <header> with ПК «Нордщит»');
    assert.match(headerLayout.source, /max-w-document/);
    assert.doesNotMatch(headerLayout.source, /glass|neon|backdrop-blur/i);

    const indexPage = vueSources().find((file) => file.path.endsWith('/pages/index.vue'));
    assert.ok(indexPage);
    assert.doesNotMatch(indexPage.source, /Принят|В расчёте|КП готово|Счёт выставлен/);
    assert.doesNotMatch(indexPage.source, /\/demo\/links/);

    for (const file of vueSources()) {
      const markup = file.source
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<style[\s\S]*?<\/style>/g, '');
      assert.doesNotMatch(
        markup,
        /#[0-9a-fA-F]{3,8}\b/,
        `${file.path} must not scatter arbitrary hex`,
      );
    }
  });
});
