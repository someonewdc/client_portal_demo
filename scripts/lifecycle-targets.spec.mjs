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

  it('declares Makefile targets up, down, dev, restart and verify', () => {
    assert.match(makefile, /^up:/m);
    assert.match(makefile, /^down:/m);
    assert.match(makefile, /^dev:/m);
    assert.match(makefile, /^restart:/m);
    assert.match(makefile, /^verify:/m);
  });

  it('verify brings up Postgres and migrates before root gates', () => {
    const verify = makefileTarget('verify');
    assert.equal(verify.prerequisites, 'up');
    assert.match(verify.recipe, /^\tpnpm db:generate$/m);
    assert.match(verify.recipe, /^\tpnpm db:migrate$/m);
  });

  it('exposes Postgres on host 5433', () => {
    const compose = readFileSync(resolve(rootDirectory, 'compose.yaml'), 'utf8');
    assert.match(compose, /5433:5432/);
    assert.match(compose, /client-portal-postgres/);
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

    assert.match(dev.recipe, /stop api web/);
    assert.match(dev.recipe, /up -d --wait postgres/);
    assert.doesNotMatch(dev.recipe, /--build/);
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

  it('keeps web free of backend source', () => {
    assert.equal(existsSync(webRoot), true, 'apps/web must exist');

    const sourceFiles = listWebSourceFiles(webRoot);
    assert.ok(sourceFiles.length > 0, 'apps/web must contain source files');

    const sources = sourceFiles.map((absolutePath) => ({
      path: webRelative(absolutePath),
      source: readFileSync(absolutePath, 'utf8'),
    }));
    const combined = sources.map(({ source }) => source).join('\n');

    assert.doesNotMatch(combined, /@prisma\/client|@nestjs\/|apps\/api/);
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

  it('installs Tailwind v4 through the official Nuxt Vite plugin', () => {
    const webPackage = webPackageJson();

    assert.equal(webPackage.dependencies?.tailwindcss, '4.3.3');
    assert.equal(webPackage.dependencies?.['@tailwindcss/vite'], '4.3.3');
    assert.equal(webPackage.dependencies?.['@fontsource/ibm-plex-sans'], '5.3.0');
    assert.match(nuxtConfigSource(), /from ['"]@tailwindcss\/vite['"]/);
    assert.match(nuxtConfigSource(), /tailwindcss\(\s*\)/);

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
    assert.match(combined, /@import\s+['"]tailwindcss['"]/);
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
    assert.match(combined, /@fontsource\/ibm-plex-sans\/cyrillic-400/);
    assert.match(combined, /@fontsource\/ibm-plex-sans\/cyrillic-600/);
    assert.match(combined, /@fontsource\/ibm-plex-sans\/latin-400/);
    assert.match(combined, /@fontsource\/ibm-plex-sans\/latin-600/);
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
    assert.match(headerLayout.source, /\bbg-paper\b/);
    assert.match(headerLayout.source, /\bbg-sheet\b/);
    assert.match(headerLayout.source, /\bfont-sans\b/);
    assert.match(headerLayout.source, /max-w-document/);
    assert.doesNotMatch(headerLayout.source, /glass|neon|backdrop-blur/i);

    const indexPage = vueSources().find((file) => file.path.endsWith('/pages/index.vue'));
    assert.ok(indexPage);
    assert.doesNotMatch(indexPage.source, /Принят|В расчёте|КП готово|Счёт выставлен/);

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

  it('declares Russian document lang, a public title and a layout heading', () => {
    assert.match(
      nuxtConfigSource(),
      /htmlAttrs:[\s\S]*?lang:\s*['"]ru['"]/,
      'nuxt.config must set htmlAttrs.lang to ru',
    );

    const layouts = layoutSources();
    const headingLayout = layouts.find(
      (file) => /<h1[\s>]/.test(file.source) && /ПК «Нордщит»/.test(file.source),
    );
    assert.ok(
      headingLayout,
      'layout must render heading ПК «Нордщит», not only a <p> in the header',
    );

    const seoHost = [
      ...layouts,
      ...vueSources().filter((file) => file.path.endsWith('/app/app.vue')),
    ].find((file) => /useSeoMeta\s*\(/.test(file.source));
    assert.ok(seoHost, 'public document must call useSeoMeta');
    assert.match(seoHost.source, /title:\s*['"]ПК «Нордщит»['"]/);
  });
});

function playwrightConfigSource() {
  return readFileSync(resolve(rootDirectory, 'playwright.config.ts'), 'utf8');
}

function listE2eSpecs() {
  const e2eRoot = resolve(rootDirectory, 'e2e');
  assert.equal(existsSync(e2eRoot), true, 'root e2e/ must exist');

  return readdirSync(e2eRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
    .map((entry) => ({
      path: `e2e/${entry.name}`,
      source: readFileSync(resolve(e2eRoot, entry.name), 'utf8'),
    }));
}

describe('feature 5 playwright harness', () => {
  it('declares pnpm test:e2e as a root Playwright wrapper', () => {
    assert.equal(typeof packageJson.scripts['test:e2e'], 'string');
    assert.match(packageJson.scripts['test:e2e'], /\bplaywright test\b/);
    assert.doesNotMatch(packageJson.scripts['test:e2e'], /\bnpx playwright\b/);
    assert.equal(packageJson.devDependencies?.['@playwright/test'], '1.63.0');

    const e2e = makefileTarget('e2e');
    assert.match(e2e.recipe, /playwright install --with-deps chromium/);
    assert.match(e2e.recipe, /^\tpnpm test:e2e$/m);
    assert.ok(
      e2e.recipe.indexOf('playwright install') < e2e.recipe.indexOf('pnpm test:e2e'),
      'make e2e must install Chromium before pnpm test:e2e',
    );

    for (const { path, json } of workspaceManifests()) {
      if (path === 'package.json') {
        continue;
      }

      assert.equal(
        listedDependencies(json)['@playwright/test'],
        undefined,
        `${path} must not own Playwright; the harness is a root script`,
      );
    }
  });

  it('points Playwright at localhost:3000 and reuses an existing Nuxt process', () => {
    const config = playwrightConfigSource();

    assert.match(config, /baseURL:\s*['"]http:\/\/localhost:3000['"]/);
    assert.match(config, /reuseExistingServer:\s*true/);
    assert.doesNotMatch(config, /reuseExistingServer:\s*!process\.env\.CI/);
    assert.match(config, /command:\s*['"][^'"]*@client-portal\/web[^'"]*['"]/);
    assert.doesNotMatch(config, /@client-portal\/api/);
    assert.doesNotMatch(config, /db:seed|db:migrate|mock-api|mock-core/);
    assert.match(config, /name:\s*['"]chromium['"]/);
    assert.doesNotMatch(config, /name:\s*['"](?:firefox|webkit)['"]/);
  });

  it('smokes the layout header on / without request screens or timeout polling', () => {
    const specs = listE2eSpecs();
    assert.ok(specs.length > 0, 'e2e/ must contain a layout smoke spec');

    const headerSpec = specs.find((file) => file.path === 'e2e/layout-header.spec.ts');
    assert.ok(headerSpec, 'e2e/layout-header.spec.ts must exist');

    assert.match(headerSpec.source, /getByRole\(\s*['"]banner['"]/);
    assert.match(headerSpec.source, /getByRole\(\s*['"]heading['"]/);
    assert.match(headerSpec.source, /ПК «Нордщит»/);
    assert.match(headerSpec.source, /content-type/);
    assert.match(headerSpec.source, /text\\\/html/);
    assert.doesNotMatch(headerSpec.source, /waitForTimeout/);
    assert.doesNotMatch(headerSpec.source, /\/demo\/links/);
    assert.doesNotMatch(headerSpec.source, /\/r\//);
    assert.doesNotMatch(headerSpec.source, /З-1004\d/);
    assert.doesNotMatch(headerSpec.source, /мессенджер|Ссылка недействительна|mock-api|mock-core/);
  });
});

describe('feature 6 demo links index', () => {
  it('exports createApiClient over createProblemAwareClient from api-client', () => {
    const apiClient = readFileSync(
      resolve(rootDirectory, 'packages/api-client/src/index.ts'),
      'utf8',
    );
    const apiClientPackage = JSON.parse(
      readFileSync(resolve(rootDirectory, 'packages/api-client/package.json'), 'utf8'),
    );
    const webPackage = JSON.parse(readFileSync(resolve(webRoot, 'package.json'), 'utf8'));

    assert.match(apiClient, /export function createApiClient/);
    assert.match(apiClient, /createProblemAwareClient/);
    assert.match(apiClient, /from ['"]@client-portal\/openapi-client-core['"]/);
    assert.equal(
      typeof apiClientPackage.dependencies?.['@client-portal/openapi-client-core'],
      'string',
    );
    assert.equal(typeof webPackage.dependencies?.['@client-portal/api-client'], 'string');
  });

  it('loads GET /demo/links through useAsyncData without session cookies or Pinia', () => {
    const sources = listWebSourceFiles(webRoot).map((absolutePath) =>
      readFileSync(absolutePath, 'utf8'),
    );
    const combined = sources.join('\n');

    assert.match(combined, /createApiClient/);
    assert.match(combined, /useAsyncData/);
    assert.match(combined, /\/demo\/links/);
    assert.doesNotMatch(combined, /credentials:\s*['"]include['"]/);
    assert.doesNotMatch(combined, /useRequestHeaders\s*\(|getRequestHeader\s*\(/);
    assert.doesNotMatch(combined, /defineStore|from ['"]pinia['"]/);
    assert.doesNotMatch(combined, /скопировать/);
    assert.doesNotMatch(combined, /href=["']#["']/);
  });

  it('states loading, error with traceId and empty on the index page', () => {
    const indexPage = readFileSync(resolve(webRoot, 'app/pages/index.vue'), 'utf8');
    const problemHelper = readFileSync(resolve(webRoot, 'app/utils/async-data-problem.ts'), 'utf8');

    assert.match(indexPage, /не показывается заказчику/);
    assert.match(indexPage, /мессенджер/);
    assert.match(indexPage, /pending/);
    assert.match(indexPage, /createError/);
    assert.match(indexPage, /data:\s*payload/);
    assert.match(indexPage, /Заявок пока нет/);
    assert.match(indexPage, /portalPath/);
    assert.match(indexPage, /tabular-nums/);
    assert.match(problemHelper, /data\.traceId/);
    assert.doesNotMatch(indexPage, /Принят|В расчёте|КП готово|Счёт выставлен/);
  });

  it('covers the index e2e against seed URLs without asserting cabinet payload', () => {
    const spec = readFileSync(resolve(rootDirectory, 'e2e/demo-links.spec.ts'), 'utf8');
    const readme = readFileSync(resolve(rootDirectory, 'README.md'), 'utf8');

    assert.match(spec, /не показывается заказчику/);
    assert.match(spec, /мессенджер/);
    assert.match(spec, /З-10041/);
    assert.match(spec, /З-10043/);
    assert.match(spec, /seed-z10043-quote-kuznetsov/);
    assert.match(spec, /updatedAt/);
    assert.match(spec, /datetime/);
    assert.doesNotMatch(spec, /waitForTimeout/);
    assert.doesNotMatch(spec, /mock-api|mock-core/);
    assert.doesNotMatch(spec, /Вводно-распределительное|Ссылка недействительна|КП-З-10043\.pdf/);
    assert.match(readme, /make dev/);
    assert.match(readme, /seed/);
    assert.doesNotMatch(readme, /поднимает только Nuxt, без API/);
    assert.match(makefile, /make dev \+ seed/);
  });
});

describe('feature 7 request cabinet', () => {
  it('loads GET /requests/{accessSecret} through useAsyncData without session cookies', () => {
    const cabinetPage = readFileSync(resolve(webRoot, 'app/pages/r/[accessSecret].vue'), 'utf8');
    const sources = listWebSourceFiles(webRoot).map((absolutePath) =>
      readFileSync(absolutePath, 'utf8'),
    );
    const combined = sources.join('\n');

    assert.match(cabinetPage, /useAsyncData/);
    assert.match(cabinetPage, /\/requests\/\{accessSecret\}/);
    assert.match(cabinetPage, /createError/);
    assert.match(cabinetPage, /data:\s*payload/);
    assert.match(cabinetPage, /Ссылка недействительна/);
    assert.match(cabinetPage, /заявки по этой ссылке нет/i);
    assert.match(cabinetPage, /Код ошибки:/);
    assert.match(cabinetPage, /role=["']alert["']/);
    assert.match(cabinetPage, /setResponseStatus/);
    assert.match(cabinetPage, /<h2[^>]*>\{\{\s*request\.publicNumber\s*\}\}<\/h2>/);
    assert.match(cabinetPage, /tabular-nums/);
    assert.match(cabinetPage, /specLines/);
    assert.match(cabinetPage, /fileName/);
    assert.doesNotMatch(combined, /credentials:\s*['"]include['"]/);
    assert.doesNotMatch(combined, /useRequestHeaders\s*\(|getRequestHeader\s*\(/);
    assert.doesNotMatch(combined, /defineStore|from ['"]pinia['"]/);
    assert.doesNotMatch(cabinetPage, /скачать/);
    assert.doesNotMatch(cabinetPage, /href=["']#["']/);
    assert.doesNotMatch(cabinetPage, /Принят|В расчёте|КП готово|Счёт выставлен/);
    assert.doesNotMatch(cabinetPage, /OTP|логин|телефон|парол/);
  });

  it('covers cabinet and unknown-secret e2e against seed without mock-api', () => {
    const spec = readFileSync(resolve(rootDirectory, 'e2e/request-cabinet.spec.ts'), 'utf8');
    const readme = readFileSync(resolve(rootDirectory, 'README.md'), 'utf8');

    assert.match(spec, /З-10043/);
    assert.match(spec, /seed-z10043-quote-kuznetsov/);
    assert.match(spec, /КП готово/);
    assert.match(spec, /Принят/);
    assert.match(spec, /Счёт выставлен/);
    assert.match(spec, /Вводно-распределительное устройство 400 А/);
    assert.match(spec, /КП-З-10043\.pdf/);
    assert.match(spec, /Опросный-лист-З-10043\.pdf/);
    assert.match(spec, /this-secret-does-not-exist/);
    assert.match(spec, /Ссылка недействительна/);
    assert.match(spec, /Этапы заявки/);
    assert.match(spec, /documentResponse\?\.status\(\)/);
    assert.match(spec, /toBe\(404\)/);
    assert.match(spec, /application\/problem\+json/);
    assert.match(spec, /localhost:3001\/api\/v1\/requests/);
    assert.match(spec, /detail\.length/);
    assert.doesNotMatch(spec, /waitForTimeout/);
    assert.doesNotMatch(spec, /mock-api|mock-core/);
    assert.match(makefile, /make dev \+ seed/);
    assert.match(readme, /\/requests\/\{accessSecret\}/);
    assert.match(readme, /:3001/);
  });
});

describe('feature 8 compose-smoke and CI e2e', () => {
  function composeSource() {
    return readFileSync(resolve(rootDirectory, 'compose.yaml'), 'utf8');
  }

  function ciSource() {
    return readFileSync(resolve(rootDirectory, '.github/workflows/ci.yml'), 'utf8');
  }

  function ciE2eJob() {
    const ci = ciSource();
    const start = ci.search(/^ {2}e2e:/m);
    assert.ok(start !== -1, 'CI must declare an e2e job');
    const fromJob = ci.slice(start);
    const nextJob = fromJob.slice(1).search(/^ {2}[a-zA-Z]/m);
    return nextJob === -1 ? fromJob : fromJob.slice(0, nextJob + 1);
  }

  it('expands the existing make up target to web, api and Postgres on demo ports', () => {
    const compose = composeSource();
    const up = makefileTarget('up');

    assert.match(compose, /5433:5432/);
    assert.match(compose, /^ {2}postgres:/m);
    assert.match(compose, /^ {2}api:/m);
    assert.match(compose, /^ {2}web:/m);
    assert.match(compose, /3001:3001/);
    assert.match(compose, /3000:3000/);
    assert.match(compose, /client-portal-postgres/);
    assert.match(compose, /client-portal-api/);
    assert.match(compose, /client-portal-web/);
    assert.match(compose, /build:/);
    assert.doesNotMatch(compose, /mock-api|mock-core|redis|kubernetes/i);

    assert.match(up.recipe, /up -d --wait postgres/);
    assert.match(up.recipe, /^\tpnpm db:generate$/m);
    assert.match(up.recipe, /^\tpnpm db:migrate$/m);
    assert.match(up.recipe, /^\tpnpm db:seed$/m);
    assert.match(up.recipe, /up -d --wait --build/);
    assert.doesNotMatch(makefile, /^full:/m);
    assert.doesNotMatch(makefile, /^stand:/m);
    assert.doesNotMatch(makefile, /^up-full:/m);
  });

  it('ships application Dockerfiles and splits Nuxt SSR API URL from the browser origin', () => {
    const compose = composeSource();
    const nuxtConfig = readFileSync(resolve(webRoot, 'nuxt.config.ts'), 'utf8');
    const apiPlugin = readFileSync(resolve(webRoot, 'app/plugins/api.ts'), 'utf8');
    const rootDockerfile = existsSync(resolve(rootDirectory, 'Dockerfile'));
    const appDockerfiles =
      existsSync(resolve(rootDirectory, 'apps/api/Dockerfile')) &&
      existsSync(resolve(rootDirectory, 'apps/web/Dockerfile'));

    assert.equal(
      rootDockerfile || appDockerfiles,
      true,
      'api and web images need Dockerfiles (root multi-stage or apps/*/Dockerfile)',
    );
    assert.match(compose, /NUXT_PUBLIC_API_BASE_URL:\s*http:\/\/localhost:3001\/api\/v1/);
    assert.match(compose, /NUXT_API_BASE_URL:\s*http:\/\/api:3001\/api\/v1/);
    assert.match(
      compose,
      /DATABASE_URL:\s*postgresql:\/\/client_portal:client_portal@postgres:5432\/client_portal/,
    );
    assert.match(nuxtConfig, /apiBaseUrl:/);
    assert.match(apiPlugin, /import\.meta\.server/);
    const [clientPath, ...serverPath] = apiPlugin.split('import.meta.server');
    assert.doesNotMatch(
      clientPath,
      /config\.apiBaseUrl/,
      'private apiBaseUrl must not be read before the import.meta.server branch',
    );
    assert.match(serverPath.join('import.meta.server'), /config\.apiBaseUrl/);
    assert.doesNotMatch(apiPlugin, /credentials:\s*['"]include['"]/);
  });

  it('copies only api dist with prod deps and Nuxt output into runtime images', () => {
    const dockerfilePath = resolve(rootDirectory, 'Dockerfile');
    assert.equal(existsSync(dockerfilePath), true, 'root Dockerfile must exist');
    const dockerfile = readFileSync(dockerfilePath, 'utf8');
    const api = dockerfileStage(dockerfile, 'api');
    const web = dockerfileStage(dockerfile, 'web');

    assert.doesNotMatch(
      api,
      /COPY --from=\S+ \/workspace \/workspace/,
      'api runtime must not copy the whole workspace tree',
    );
    assert.doesNotMatch(
      web,
      /COPY --from=\S+ \/workspace \/workspace/,
      'web runtime must not copy the whole workspace tree',
    );
    assert.match(dockerfile, /deploy --prod/);
    assert.doesNotMatch(
      dockerfile,
      /deploy --prod --legacy/,
      'legacy deploy leaves workspace package symlinks pointing at /workspace',
    );
    assert.match(api, /dist\/main\.js/);
    assert.match(web, /\.output/);
    assert.doesNotMatch(web, /apps\/api\/src/);
    assert.doesNotMatch(api, /apps\/web\/app/);
  });

  it('probes ready 200, Postgres 5433 and the index disclaimer after make up', () => {
    const smokePath = resolve(rootDirectory, 'scripts/compose-smoke.mjs');
    assert.equal(existsSync(smokePath), true, 'scripts/compose-smoke.mjs must exist');

    const smoke = readFileSync(smokePath, 'utf8');
    assert.match(smoke, /localhost:3001\/api\/v1\/health\/ready/);
    assert.match(smoke, /localhost:3000/);
    assert.match(smoke, /не показывается заказчику/);
    assert.match(smoke, /5433/);
    assert.match(smoke, /client-portal-api/);
    assert.match(smoke, /client-portal-web/);
    assert.match(smoke, /client-portal-postgres/);
    assert.doesNotMatch(smoke, /waitForTimeout/);
    assert.doesNotMatch(smoke, /mock-api|mock-core/);
    assert.doesNotMatch(packageJson.scripts.test, /compose-smoke/);
  });

  it('verify runs compose-smoke and e2e after the root gates when the stand is up', () => {
    const verify = makefileTarget('verify');
    assert.equal(verify.prerequisites, 'up');
    assert.match(verify.recipe, /^\tpnpm check:boundaries$/m);
    assert.match(verify.recipe, /^\tpnpm build$/m);
    assert.match(verify.recipe, /scripts\/compose-smoke\.mjs/);
    assert.match(verify.recipe, /playwright install --with-deps chromium/);
    assert.match(verify.recipe, /^\tpnpm test:e2e$/m);
    const smokeIndex = verify.recipe.indexOf('scripts/compose-smoke.mjs');
    const e2eIndex = verify.recipe.indexOf('pnpm test:e2e');
    const buildIndex = verify.recipe.indexOf('pnpm build');
    const installIndex = verify.recipe.indexOf('playwright install');
    assert.ok(buildIndex !== -1 && smokeIndex > buildIndex && e2eIndex > smokeIndex);
    assert.ok(
      installIndex !== -1 && installIndex < e2eIndex,
      'make verify must install Chromium before pnpm test:e2e',
    );
  });

  it('CI e2e job runs Playwright against make up without a second Nuxt webServer', () => {
    const job = ciE2eJob();
    const config = playwrightConfigSource();
    const demoLinks = readFileSync(resolve(rootDirectory, 'e2e/demo-links.spec.ts'), 'utf8');
    const cabinet = readFileSync(resolve(rootDirectory, 'e2e/request-cabinet.spec.ts'), 'utf8');

    assert.match(job, /make up/);
    assert.match(job, /pnpm test:e2e/);
    assert.match(job, /playwright install/);
    assert.match(job, /chromium/);
    assert.doesNotMatch(job, /continue-on-error:\s*true/);
    assert.doesNotMatch(job, /if:\s*false/);
    assert.doesNotMatch(job, /mock-api|webServer:/);
    assert.match(job, /5433/);
    assert.doesNotMatch(job, /localhost:5432/);

    assert.match(config, /process\.env\.CI\s*\?/);
    assert.match(config, /reuseExistingServer:\s*true/);
    assert.doesNotMatch(config, /reuseExistingServer:\s*!process\.env\.CI/);
    assert.match(config, /command:\s*['"][^'"]*@client-portal\/web[^'"]*['"]/);
    assert.doesNotMatch(config, /@client-portal\/api/);

    assert.match(demoLinks, /не показывается заказчику/);
    assert.match(demoLinks, /З-10043/);
    assert.match(cabinet, /З-10043/);
    assert.match(cabinet, /this-secret-does-not-exist/);
    assert.match(cabinet, /Ссылка недействительна/);
    assert.doesNotMatch(demoLinks, /waitForTimeout/);
    assert.doesNotMatch(cabinet, /waitForTimeout/);
  });

  it('documents raising the demo through make up in the root README', () => {
    const readme = readFileSync(resolve(rootDirectory, 'README.md'), 'utf8');
    assert.match(readme, /make up/);
    assert.match(readme, /:3000/);
    assert.match(readme, /:3001/);
    assert.match(readme, /5433/);
    assert.doesNotMatch(readme, /make up` поднимает только Postgres/);
    assert.doesNotMatch(readme, /CI e2e — фича 8/);
    assert.doesNotMatch(readme, /Ещё нет \(заводит фича 8\)/);
    assert.match(readme, /make e2e/);
    assert.match(readme, /make verify/);
    assert.match(readme, /playwright install --with-deps chromium/);
  });
});

describe('stand restart and leftover ports', () => {
  it('reclaims D-006 ports through a script and Makefile variables', () => {
    const scriptPath = resolve(rootDirectory, 'scripts/free-stand-ports.mjs');
    assert.equal(existsSync(scriptPath), true, 'scripts/free-stand-ports.mjs must exist');

    assert.match(makefile, /^APP_PORTS \?= 3000 3001$/m);
    assert.match(makefile, /^STAND_PORTS \?= 3000 3001 5433$/m);
    assert.match(makefile, /^free-ports:/m);

    const freePorts = makefileTarget('free-ports');
    assert.match(freePorts.recipe, /scripts\/free-stand-ports\.mjs \$\(STAND_PORTS\)/);
  });

  it('down stops compose then frees leftover listeners on stand ports', () => {
    const down = makefileTarget('down');
    assert.match(down.recipe, /\$\(compose\) down/);
    assert.match(down.recipe, /scripts\/free-stand-ports\.mjs \$\(STAND_PORTS\)/);
    assert.ok(
      down.recipe.indexOf('$(compose) down') < down.recipe.indexOf('free-stand-ports.mjs'),
      'compose down must release published ports before leftover host listeners are killed',
    );
  });

  it('dev frees host :3000 and :3001 before pnpm dev so leftover nest/nuxt do not EADDRINUSE', () => {
    const dev = makefileTarget('dev');
    const freeLine = dev.recipe.split('\n').find((line) => line.includes('free-stand-ports.mjs'));

    assert.ok(freeLine, 'make dev must call free-stand-ports.mjs');
    assert.match(freeLine, /\$\(APP_PORTS\)/);
    assert.doesNotMatch(freeLine, /STAND_PORTS|5433/);
    assert.ok(
      dev.recipe.indexOf('stop api web') < dev.recipe.indexOf('free-stand-ports.mjs'),
      'compose api/web must stop before host listeners are killed',
    );
    assert.ok(
      dev.recipe.indexOf('free-stand-ports.mjs') < dev.recipe.indexOf('pnpm dev'),
      'leftover :3000/:3001 must be free before pnpm dev binds them',
    );
  });

  it('restart downs the stand then starts make dev', () => {
    const restart = makefileTarget('restart');
    assert.equal(restart.prerequisites, 'down');
    assert.match(restart.recipe, /\$\(MAKE\)\s+dev/);

    const readme = readFileSync(resolve(rootDirectory, 'README.md'), 'utf8');
    assert.match(readme, /make restart/);
  });

  it('does not treat Docker Desktop helpers as reclaimable leftover listeners', () => {
    const script = readFileSync(resolve(rootDirectory, 'scripts/free-stand-ports.mjs'), 'utf8');
    assert.match(script, /com\.dock/);
    assert.match(script, /vpnkit/);
    assert.match(script, /docker-pr/);
    assert.match(script, /classifyListener/);
    assert.match(script, /mainthread/);

    const decisions = readFileSync(resolve(rootDirectory, 'docs/decisions.md'), 'utf8');
    assert.match(decisions, /D-028/);
    assert.match(decisions, /com\.docker/);
  });
});

function dockerfileStage(source, name) {
  const start = source.search(new RegExp(`^FROM .+ AS ${name}$`, 'm'));
  assert.ok(start !== -1, `missing Dockerfile stage ${name}`);
  const fromStage = source.slice(start);
  const next = fromStage.slice(1).search(/^FROM /m);
  return next === -1 ? fromStage : fromStage.slice(0, next + 1);
}
