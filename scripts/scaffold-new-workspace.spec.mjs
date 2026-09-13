import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = resolve(rootDirectory, 'scripts/scaffold-new-workspace.mjs');

const validFlags = {
  scope: '@protostar',
  name: 'protostar-status',
  brand: 'Protostar',
  preset: 'core',
};

function flagArgv(flags) {
  const argv = [];
  for (const [name, value] of Object.entries(flags)) {
    if (value === undefined) {
      continue;
    }
    argv.push(`--${name}`, String(value));
  }
  return argv;
}

function runCli(args, cwd = rootDirectory) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
  });
}

async function loadScaffold() {
  return import(`${pathToFileURL(scriptPath).href}?t=${Date.now()}`);
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function listRelativeFiles(directory, prefix = '') {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory() || statSync(absolutePath).isDirectory()) {
      files.push(...listRelativeFiles(absolutePath, relativePath));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

describe('S1 scaffold CLI parse', () => {
  it('exits non-zero and names the missing required flag', () => {
    const result = runCli(
      flagArgv({
        scope: validFlags.scope,
        name: validFlags.name,
        brand: validFlags.brand,
        preset: validFlags.preset,
      }),
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--out/);
  });

  it('rejects a preset that is not core or portal', () => {
    const result = runCli(
      flagArgv({
        ...validFlags,
        out: join(tmpdir(), 'scaffold-invalid-preset'),
        preset: 'theater',
      }),
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--preset/);
  });

  it('rejects illegal scopes', () => {
    for (const scope of ['@', '@client-portal', '@Proto', '@a/b']) {
      const result = runCli(
        flagArgv({
          ...validFlags,
          out: join(tmpdir(), 'scaffold-invalid-scope'),
          scope,
        }),
      );
      assert.notEqual(result.status, 0, scope);
      assert.match(result.stderr, /--scope/, scope);
    }
  });

  it('rejects the source workspace name', () => {
    const result = runCli(
      flagArgv({
        ...validFlags,
        out: join(tmpdir(), 'scaffold-invalid-name'),
        name: 'client-portal-demo',
      }),
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--name/);
  });

  it('rejects the Nordshchit brand', () => {
    const result = runCli(
      flagArgv({
        ...validFlags,
        out: join(tmpdir(), 'scaffold-invalid-brand'),
        brand: 'Нордщит',
      }),
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--brand/);
  });

  it('rejects a brand that would break dest TypeScript or JSON string literals', async () => {
    const { parseArgs } = await loadScaffold();
    for (const brand of ["Builder's Lab", 'Foo"Bar', 'Cash$Brand', 'A`Tick']) {
      const dest = join(tmpdir(), `scaffold-unsafe-brand-${process.pid}-${brand.length}`);
      assert.throws(
        () =>
          parseArgs(flagArgv({ ...validFlags, out: dest, brand }), {
            cwd: rootDirectory,
            sourceRoot: rootDirectory,
          }),
        /--brand/,
        brand,
      );
      assert.equal(existsSync(dest), false, brand);
    }
  });

  it('parses a Cyrillic brand without writing dest', async () => {
    const dest = join(tmpdir(), `scaffold-cyrillic-brand-${process.pid}`);
    const { parseArgs } = await loadScaffold();
    const parsed = parseArgs(flagArgv({ ...validFlags, out: dest, brand: 'Протостар' }), {
      cwd: rootDirectory,
      sourceRoot: rootDirectory,
    });
    assert.equal(parsed.brand, 'Протостар');
    assert.equal(existsSync(dest), false);
  });

  it('rejects a non-integer port, port 80, reserved 3000, and duplicate web/api ports', () => {
    const cases = [
      { flag: 'web-port', value: '3000.5', named: /--web-port/ },
      { flag: 'web-port', value: '80', named: /--web-port/ },
      { flag: 'web-port', value: '3000', named: /--web-port/ },
      { flag: 'api-port', value: '3001', named: /--api-port/ },
      {
        flag: 'web-port',
        value: '3100',
        extra: { 'api-port': '3100' },
        named: /--web-port|--api-port/,
      },
    ];

    for (const testCase of cases) {
      const result = runCli(
        flagArgv({
          ...validFlags,
          out: join(tmpdir(), 'scaffold-invalid-port'),
          [testCase.flag]: testCase.value,
          ...testCase.extra,
        }),
      );
      assert.notEqual(result.status, 0, `${testCase.flag}=${testCase.value}`);
      assert.match(result.stderr, testCase.named, `${testCase.flag}=${testCase.value}`);
    }
  });

  it('refuses --out inside this git and does not add product files to apps or packages', async () => {
    const inside = join(rootDirectory, 'scripts', 'scaffold-inside-git-out');
    const result = runCli(flagArgv({ ...validFlags, out: inside }));
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--out/);
    assert.equal(existsSync(inside), false);

    const { parseArgs } = await loadScaffold();
    assert.throws(
      () =>
        parseArgs(flagArgv({ ...validFlags, out: 'apps/api' }), {
          cwd: rootDirectory,
          sourceRoot: rootDirectory,
        }),
      /--out/,
    );
    assert.equal(
      existsSync(join(rootDirectory, 'apps', 'api', 'scaffold-new-workspace.mjs')),
      false,
    );
    assert.equal(
      existsSync(join(rootDirectory, 'packages', 'platform-core', 'scaffold-new-workspace.mjs')),
      false,
    );
  });

  it('refuses a non-empty existing --out', () => {
    const dest = mkdtempSync(join(tmpdir(), 'scaffold-nonempty-'));
    writeFileSync(join(dest, 'keep.txt'), 'no\n');
    const result = runCli(flagArgv({ ...validFlags, out: dest }));
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /--out/);
    assert.equal(read(join(dest, 'keep.txt')), 'no\n');
  });

  it('parses valid flags with default ports and does not write dest', async () => {
    const dest = join(tmpdir(), `scaffold-parse-only-${process.pid}`);
    const { parseArgs } = await loadScaffold();
    const parsed = parseArgs(flagArgv({ ...validFlags, out: dest }), {
      cwd: rootDirectory,
      sourceRoot: rootDirectory,
    });
    assert.equal(parsed.preset, 'core');
    assert.equal(parsed.scope, '@protostar');
    assert.equal(parsed.name, 'protostar-status');
    assert.equal(parsed.brand, 'Protostar');
    assert.equal(parsed.webPort, 3100);
    assert.equal(parsed.apiPort, 3101);
    assert.equal(parsed.postgresPort, 5434);
    assert.equal(existsSync(dest), false);
  });
});

describe('S2 rewrite tokens', () => {
  it('rewrites scope, brand, name and ports on a fixture string without copying apps', async () => {
    const { rewriteTokens } = await loadScaffold();
    const fixture = [
      "import { x } from '@client-portal/platform-core/http';",
      'ПК «Нордщит»',
      'WEB_ORIGIN=http://localhost:3000',
      'API_PORT=3001',
      'DATABASE_URL=postgresql://client_portal:client_portal@127.0.0.1:5433/client_portal',
      '"name": "client-portal-demo"',
    ].join('\n');
    const rewritten = rewriteTokens(fixture, {
      apiPort: 3101,
      brand: 'Protostar',
      dbName: 'protostar_status',
      name: 'protostar-status',
      postgresPort: 5434,
      scope: '@protostar',
      webPort: 3100,
    });
    assert.doesNotMatch(rewritten, /@client-portal/);
    assert.doesNotMatch(rewritten, /ПК «Нордщит»/);
    assert.doesNotMatch(rewritten, /client-portal-demo/);
    assert.match(rewritten, /@protostar\/platform-core\/http/);
    assert.match(rewritten, /Protostar/);
    assert.match(rewritten, /localhost:3100/);
    assert.match(rewritten, /API_PORT=3101/);
    assert.match(rewritten, /:5434\//);
    assert.match(rewritten, /protostar-status/);
    assert.equal(existsSync(join(rootDirectory, 'apps', 'protostar')), false);
  });
});

describe('S3 theater guards', () => {
  it('treats denylist paths from the plan as theater', async () => {
    const { isTheaterPath } = await loadScaffold();
    const denylist = [
      'request-catalog.ts',
      'apps/api/src/requests/domain/request-catalog.ts',
      'demo-links.controller.ts',
      'apps/api/src/requests/http/demo-links.controller.ts',
      'apps/api/src/requests/http/demo-conductor.controller.ts',
      'apps/web/app/pages/start.vue',
      'pages/start.vue',
      'apps/web/app/pages/c/index.vue',
      'live-cabinet-poll.ts',
      'apps/web/app/utils/live-cabinet-poll.ts',
    ];
    for (const path of denylist) {
      assert.equal(isTheaterPath(path), true, path);
    }
    assert.equal(isTheaterPath('packages/platform-core/src/http.ts'), false);
  });

  it('collects theater leak tokens and stays empty on a clean fixture', async () => {
    const { collectTheaterLeaks } = await loadScaffold();
    const dirty = collectTheaterLeaks(
      'publicNumber З-10043 demoLive REQUEST_CATALOG DEMO_CONDUCTOR_SECRET',
    );
    assert.ok(dirty.length > 0);
    assert.ok(dirty.some((token) => token.includes('З-1004')));
    assert.ok(dirty.some((token) => token.includes('demoLive')));
    assert.ok(dirty.some((token) => token.includes('REQUEST_CATALOG')));
    assert.ok(dirty.some((token) => token.includes('DEMO_CONDUCTOR_SECRET')));
    assert.deepEqual(collectTheaterLeaks('RuntimeProbe health ready Protostar'), []);
  });
});

const createdDests = [];

function uniqueDest(label) {
  const dest = mkdtempSync(join(tmpdir(), `scaffold-${label}-`));
  rmSync(dest, { recursive: true, force: true });
  createdDests.push(dest);
  return dest;
}

after(() => {
  for (const dest of createdDests) {
    rmSync(dest, { recursive: true, force: true });
  }
});

describe('S4 core preset tree', () => {
  it('copies the five core packages without kit C, theater, or source mutation', async () => {
    const { parseArgs, scaffoldWorkspace, collectTheaterLeaks } = await loadScaffold();
    const dest = uniqueDest('core');
    const options = parseArgs(flagArgv({ ...validFlags, out: dest, preset: 'core' }), {
      cwd: rootDirectory,
      sourceRoot: rootDirectory,
    });
    await scaffoldWorkspace(options);

    const packages = [
      'packages/platform-core/package.json',
      'packages/nestjs-core/package.json',
      'packages/openapi-client-core/package.json',
      'packages/tsconfig/package.json',
      'packages/eslint-config/package.json',
    ];
    for (const path of packages) {
      assert.equal(existsSync(join(dest, path)), true, path);
      assert.doesNotMatch(read(join(dest, path)), /@client-portal/);
      assert.match(read(join(dest, path)), /@protostar\//);
    }

    assert.equal(existsSync(join(dest, 'apps/web/app/pages/r')), false);
    assert.equal(
      existsSync(join(dest, 'apps/api/src/requests/http/request-portal.controller.ts')),
      false,
    );
    const appModule = read(join(dest, 'apps/api/src/app.module.ts'));
    assert.doesNotMatch(appModule, /RequestsModule/);
    assert.doesNotMatch(appModule, /ThrottlerModule/);

    const index = read(join(dest, 'apps/web/app/pages/index.vue'));
    assert.doesNotMatch(index, /\/demo\/links/);
    assert.doesNotMatch(index, /Ссылки для показа/);
    assert.doesNotMatch(index, /ПК «Нордщит»/);

    const denylistFiles = [
      'apps/api/src/requests/domain/request-catalog.ts',
      'apps/api/src/requests/http/demo-links.controller.ts',
      'apps/web/app/pages/start.vue',
      'apps/web/app/utils/live-cabinet-poll.ts',
    ];
    for (const path of denylistFiles) {
      assert.equal(existsSync(join(dest, path)), false, path);
    }

    const destFiles = listRelativeFiles(dest);
    for (const relativePath of destFiles) {
      const content = read(join(dest, relativePath));
      assert.deepEqual(collectTheaterLeaks(content), [], relativePath);
    }

    assert.equal(
      existsSync(join(rootDirectory, 'apps/api/src/requests/domain/request-catalog.ts')),
      true,
    );
    assert.match(
      read(join(rootDirectory, 'packages/platform-core/package.json')),
      /@client-portal/,
    );
    assert.match(read(join(rootDirectory, 'apps/web/app/pages/index.vue')), /Ссылки для показа/);

    const destPackage = JSON.parse(read(join(dest, 'package.json')));
    assert.doesNotMatch(destPackage.scripts.test, /scaffold-new-workspace/);
    assert.doesNotMatch(destPackage.scripts.test, /lifecycle-targets/);
    const destTestFiles = destPackage.scripts.test
      .split(/node --test\s+/)[1]
      .trim()
      .split(/\s+/);
    assert.ok(destTestFiles.length > 0);
    for (const file of destTestFiles) {
      assert.equal(existsSync(join(dest, file)), true, file);
    }
  });
});

describe('S5 portal preset mixed rewrite', () => {
  it('keeps the cabinet kit and strips demo/conductor/live tokens', async () => {
    const { parseArgs, scaffoldWorkspace, collectTheaterLeaks } = await loadScaffold();
    const dest = uniqueDest('portal');
    const options = parseArgs(flagArgv({ ...validFlags, out: dest, preset: 'portal' }), {
      cwd: rootDirectory,
      sourceRoot: rootDirectory,
    });
    await scaffoldWorkspace(options);

    assert.equal(
      existsSync(join(dest, 'apps/api/src/requests/http/request-portal.controller.ts')),
      true,
    );
    assert.equal(existsSync(join(dest, 'apps/web/app/pages/r/[accessSecret]/index.vue')), true);
    assert.equal(
      existsSync(join(dest, 'apps/web/app/pages/r/[accessSecret]/d/[fileName].vue')),
      true,
    );

    const requestsModule = read(join(dest, 'apps/api/src/requests/requests.module.ts'));
    assert.match(requestsModule, /RequestPortalController/);
    assert.doesNotMatch(requestsModule, /DemoLinks|DemoConductor|live|Conductor/i);

    const dto = read(join(dest, 'apps/api/src/requests/http/request.dto.ts'));
    const useCase = read(
      join(dest, 'apps/api/src/requests/application/get-request-by-access-secret.use-case.ts'),
    );
    assert.doesNotMatch(dto, /demoLive/);
    assert.doesNotMatch(useCase, /demoLive/);

    const seed = read(join(dest, 'apps/api/prisma/seed.ts'));
    const applySeed = read(
      join(dest, 'apps/api/src/requests/infrastructure/apply-request-seed.ts'),
    );
    assert.doesNotMatch(seed, /REQUEST_CATALOG/);
    assert.doesNotMatch(applySeed, /REQUEST_CATALOG/);
    assert.doesNotMatch(seed, /deleteMany/);
    assert.doesNotMatch(applySeed, /deleteMany/);

    const nuxt = read(join(dest, 'apps/web/nuxt.config.ts'));
    assert.doesNotMatch(nuxt, /\/start/);
    assert.doesNotMatch(nuxt, /\/c\/\*\*/);

    const denylistFiles = [
      'apps/api/src/requests/domain/request-catalog.ts',
      'apps/api/src/requests/http/demo-links.controller.ts',
      'apps/web/app/pages/start.vue',
      'apps/web/app/pages/c',
    ];
    for (const path of denylistFiles) {
      assert.equal(existsSync(join(dest, path)), false, path);
    }

    for (const relativePath of listRelativeFiles(dest)) {
      assert.deepEqual(collectTheaterLeaks(read(join(dest, relativePath))), [], relativePath);
    }

    const coreDest = uniqueDest('core-kit-c');
    const coreOptions = parseArgs(flagArgv({ ...validFlags, out: coreDest, preset: 'core' }), {
      cwd: rootDirectory,
      sourceRoot: rootDirectory,
    });
    await scaffoldWorkspace(coreOptions);
    assert.equal(
      existsSync(join(coreDest, 'apps/api/src/requests/http/request-portal.controller.ts')),
      false,
    );
    assert.equal(existsSync(join(coreDest, 'apps/web/app/pages/r')), false);
  });
});

describe('S6 dest install and core build', { timeout: 600_000 }, () => {
  it('installs and builds core packages in a core dest without binding D-006 ports', async () => {
    const { parseArgs, scaffoldWorkspace, finalizeWorkspace } = await loadScaffold();
    const dest = uniqueDest('s6-core');
    const options = parseArgs(flagArgv({ ...validFlags, out: dest, preset: 'core' }), {
      cwd: rootDirectory,
      sourceRoot: rootDirectory,
    });
    await scaffoldWorkspace(options);
    await finalizeWorkspace(options);

    assert.equal(existsSync(join(dest, 'packages/platform-core/dist')), true);
    assert.equal(existsSync(join(dest, 'packages/api-client/openapi.json')), true);
    const openapi = read(join(dest, 'packages/api-client/openapi.json'));
    assert.match(openapi, /\/health\/live/);
    assert.doesNotMatch(openapi, /\/demo\/links/);
    assert.doesNotMatch(openapi, /\/requests\/\{accessSecret\}/);
    assert.match(
      read(join(rootDirectory, 'packages/platform-core/package.json')),
      /@client-portal/,
    );
  });
});
