import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compiledDistFilePattern = /^dist\/.+\.(?:d\.ts|d\.ts\.map|js|js\.map)$/;

export const REUSABLE_PACKAGES = [
  {
    directory: 'packages/tsconfig',
    kind: 'json',
    name: '@client-portal/tsconfig',
    needsBuild: false,
  },
  {
    directory: 'packages/eslint-config',
    kind: 'eslint',
    name: '@client-portal/eslint-config',
    needsBuild: false,
  },
  {
    directory: 'packages/platform-core',
    kind: 'compiled',
    name: '@client-portal/platform-core',
    needsBuild: true,
  },
  {
    directory: 'packages/nestjs-core',
    kind: 'compiled',
    name: '@client-portal/nestjs-core',
    needsBuild: true,
  },
  {
    directory: 'packages/openapi-client-core',
    kind: 'compiled',
    name: '@client-portal/openapi-client-core',
    needsBuild: true,
  },
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function normalizePackPath(packPath) {
  return packPath.replaceAll('\\', '/').replace(/^package\//, '');
}

export function tarballPathViolation(packPath) {
  const relativePath = normalizePackPath(packPath);
  if (relativePath === '' || relativePath.endsWith('/')) {
    return undefined;
  }

  const segments = relativePath.split('/');
  const baseName = segments.at(-1) ?? relativePath;

  if (segments.includes('apps')) {
    return 'app-source';
  }
  if (segments.includes('src')) {
    return 'source-directory';
  }
  if (segments.includes('tests') || segments.includes('test')) {
    return 'tests';
  }
  if (segments.includes('node_modules')) {
    return 'dependencies';
  }
  if (baseName === '.env' || baseName.startsWith('.env.')) {
    return 'secrets';
  }
  if (baseName === 'schema.d.ts') {
    return 'generated-project-schema';
  }
  if (
    baseName.endsWith('.spec.ts') ||
    baseName.endsWith('.spec.mjs') ||
    baseName.endsWith('.spec.js')
  ) {
    return 'tests';
  }
  if (baseName.endsWith('.tsbuildinfo')) {
    return 'build-cache';
  }
  if (baseName === 'AGENTS.md') {
    return 'internal-docs';
  }
  return undefined;
}

export function isAllowedTarballEntry(kind, packPath) {
  const relativePath = normalizePackPath(packPath);
  if (relativePath === '' || relativePath.endsWith('/')) {
    return true;
  }
  if (relativePath === 'package.json' || relativePath === 'README.md') {
    return true;
  }
  if (tarballPathViolation(relativePath)) {
    return false;
  }
  if (kind === 'compiled') {
    return compiledDistFilePattern.test(relativePath);
  }
  if (kind === 'eslint') {
    return relativePath === 'index.mjs';
  }
  if (kind === 'json') {
    return relativePath === 'base.json' || relativePath === 'nest.json';
  }
  return false;
}

export function describeTarballEntry(kind, packPath) {
  const relativePath = normalizePackPath(packPath);
  const violation = tarballPathViolation(relativePath);
  if (violation) {
    return { allowed: false, reason: violation, relativePath };
  }
  if (isAllowedTarballEntry(kind, packPath)) {
    return { allowed: true, relativePath };
  }
  return { allowed: false, reason: 'unexpected-artifact', relativePath };
}

export function isRepoPackagePath(resolvedPath, repoRoot = rootDirectory) {
  const packagesRoot = resolve(repoRoot, 'packages');
  const relativePath = relative(packagesRoot, resolve(resolvedPath));
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

export function publicImportSpecifiers(packageJson) {
  return Object.keys(packageJson.exports ?? {}).map((key) =>
    key === '.' ? packageJson.name : `${packageJson.name}${key.slice(1)}`,
  );
}

function run(command, args, cwd) {
  const env = {
    ...process.env,
    COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
    COREPACK_ENABLE_NETWORK: '0',
  };

  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const stdout = typeof error.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error.stderr === 'string' ? error.stderr : '';
    throw new Error(`${command} ${args.join(' ')} failed:\n${stdout}${stderr}`);
  }
}

function listTarballEntries(tarballPath) {
  return run('tar', ['-tzf', tarballPath], rootDirectory)
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function tarballFileName(packageName, version) {
  return `${packageName.replace('@', '').replace('/', '-')}-${version}.tgz`;
}

function collectHostSpecifiers(manifests) {
  const specifiers = new Set(['@types/node', 'typescript']);
  for (const manifest of manifests) {
    for (const name of Object.keys({
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    })) {
      if (!name.startsWith('@client-portal/')) {
        specifiers.add(name);
      }
    }
  }
  return [...specifiers].sort();
}

function resolveWorkspaceInstall(specifier) {
  const searchRoots = [
    rootDirectory,
    join(rootDirectory, 'packages/platform-core'),
    join(rootDirectory, 'packages/nestjs-core'),
    join(rootDirectory, 'packages/openapi-client-core'),
    join(rootDirectory, 'packages/eslint-config'),
    join(rootDirectory, 'apps/api'),
  ];

  for (const searchRoot of searchRoots) {
    const candidate = join(searchRoot, 'node_modules', ...specifier.split('/'));
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Workspace install does not contain ${specifier}`);
}

async function extractTarball(tarballPath, destination) {
  await mkdir(destination, { recursive: true });
  run('tar', ['-xzf', tarballPath, '--strip-components=1', '-C', destination], rootDirectory);
}

async function rewriteWorkspaceProtocol(extractedDirectory, consumerScopedDirectory) {
  const manifestPath = join(extractedDirectory, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  let changed = false;

  for (const section of ['dependencies', 'peerDependencies', 'devDependencies']) {
    const entries = manifest[section];
    if (!entries) {
      continue;
    }
    for (const [name, version] of Object.entries(entries)) {
      if (!name.startsWith('@client-portal/')) {
        continue;
      }
      const relativePath = relative(
        extractedDirectory,
        join(consumerScopedDirectory, name.split('/')[1]),
      );
      const nextVersion = `file:${relativePath}`;
      if (version !== nextVersion) {
        entries[name] = nextVersion;
        changed = true;
      }
    }
  }

  if (changed) {
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

async function linkHostSpecifier(specifier, consumerDirectory) {
  const destination = join(consumerDirectory, 'node_modules', ...specifier.split('/'));
  if (existsSync(destination)) {
    return;
  }

  await mkdir(dirname(destination), { recursive: true });
  await symlink(await realpath(resolveWorkspaceInstall(specifier)), destination);
}

async function writeConsumerManifest(consumerDirectory) {
  await writeFile(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'client-portal-package-smoke-consumer',
        private: true,
        type: 'module',
        engines: { node: '>=24.11.0 <25' },
      },
      null,
      2,
    )}\n`,
  );
}

function assertTarballContents(kind, packageName, tarballPath) {
  const entries = listTarballEntries(tarballPath);
  const disallowed = entries
    .map((entry) => describeTarballEntry(kind, entry))
    .filter((entry) => !entry.allowed);

  if (disallowed.length > 0) {
    const details = disallowed
      .map(({ relativePath, reason }) => `${relativePath} (${reason})`)
      .join('\n');
    throw new Error(`${packageName} tarball contains disallowed paths:\n${details}`);
  }

  if (!entries.some((entry) => normalizePackPath(entry) === 'package.json')) {
    throw new Error(`${packageName} tarball is missing package.json`);
  }
  if (!entries.some((entry) => normalizePackPath(entry) === 'README.md')) {
    throw new Error(`${packageName} tarball is missing README.md`);
  }
}

async function writeConsumerSources(consumerDirectory) {
  await writeFile(
    join(consumerDirectory, 'platform-consumer.ts'),
    `import {
  CORRELATION_ID_HEADER,
  resolveCorrelationId,
} from '@client-portal/platform-core/correlation-id';
import { z } from 'zod';
import { nodeEnvironmentSchema, validateEnvironment } from '@client-portal/platform-core/environment';
import { resolveFeatureFlags } from '@client-portal/platform-core/feature-flags';
import { serializeHttpRequest } from '@client-portal/platform-core/http';
import { generateOpaqueToken, hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { hasAllPermissions } from '@client-portal/platform-core/permissions';
import {
  PROBLEM_DETAILS_MEDIA_TYPE,
  isProblemDetails,
} from '@client-portal/platform-core/problem-details';
import { normalizeIntegerInput } from '@client-portal/platform-core/input';
import { redactJsonObject } from '@client-portal/platform-core/json';
import { exactHttpBaseUrlSchema } from '@client-portal/platform-core/url';

export const header = CORRELATION_ID_HEADER;
export const mediaType = PROBLEM_DETAILS_MEDIA_TYPE;
export const traceId = resolveCorrelationId(undefined);
export const env = validateEnvironment(
  z.object({ NODE_ENV: nodeEnvironmentSchema }),
  { NODE_ENV: 'test' },
  'smoke',
);
export const features = resolveFeatureFlags({
  profile: 'demo',
  profiles: { demo: { catalog: true } },
});
export const request = serializeHttpRequest({ id: traceId, method: 'GET', url: '/health?x=1' });
export const token = hashOpaqueToken(generateOpaqueToken());
export const allowed = hasAllPermissions(['catalog.read'], ['catalog.read']);
export const problem = isProblemDetails({
  type: 'about:blank',
  title: 'Smoke',
  status: 400,
  detail: 'n/a',
  instance: '/smoke',
  traceId,
});
export const quantity = normalizeIntegerInput('12', 1, 100);
export const redacted = redactJsonObject({ token: 'secret', ok: true });
export const url = exactHttpBaseUrlSchema('/api/v1');
`,
  );

  await writeFile(
    join(consumerDirectory, 'nest-consumer.ts'),
    `import 'reflect-metadata';

import {
  configureBaseFastifyApplication,
  createCorrelatedFastifyAdapter,
} from '@client-portal/nestjs-core/bootstrap';
import { PlatformLoggingModule } from '@client-portal/nestjs-core/logging';
import { RATE_LIMIT_RESPONSE, TraceMetaDto } from '@client-portal/nestjs-core/openapi';
import { provideProblemDetailsFilter } from '@client-portal/nestjs-core/problem-details';
import { createGlobalValidationPipe } from '@client-portal/nestjs-core/validation';

export const adapter = createCorrelatedFastifyAdapter();
export const logging = PlatformLoggingModule.forRoot();
export const pipe = createGlobalValidationPipe();
export const filter = provideProblemDetailsFilter({
  typeBaseUrl: 'https://demo.local/problems',
});
export const rateLimit = RATE_LIMIT_RESPONSE;
export const meta: TraceMetaDto = { traceId: '00000000-0000-4000-8000-000000000000' };
export const configure = configureBaseFastifyApplication;
`,
  );

  await writeFile(
    join(consumerDirectory, 'openapi-consumer.ts'),
    `import {
  ApiNetworkError,
  ApiProblemError,
  createProblemAwareClient,
} from '@client-portal/openapi-client-core';

interface SmokePaths {
  '/health/live': {
    get: {
      responses: { 200: { content: { 'application/json': { status: string } } } };
    };
  };
}

export const client = createProblemAwareClient<SmokePaths>('https://api.example.test/api/v1');
export const problemError = ApiProblemError;
export const networkError = ApiNetworkError;
`,
  );

  const compilerOptions = {
    noEmit: true,
    rootDir: '.',
    types: ['node'],
  };

  await writeFile(
    join(consumerDirectory, 'tsconfig.platform.json'),
    `${JSON.stringify(
      {
        extends: '@client-portal/tsconfig/base.json',
        compilerOptions,
        include: ['platform-consumer.ts'],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(consumerDirectory, 'tsconfig.nest.json'),
    `${JSON.stringify(
      {
        extends: '@client-portal/tsconfig/nest.json',
        compilerOptions: { ...compilerOptions, declaration: false, skipLibCheck: true },
        include: ['nest-consumer.ts'],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(consumerDirectory, 'tsconfig.openapi.json'),
    `${JSON.stringify(
      {
        extends: '@client-portal/tsconfig/base.json',
        compilerOptions,
        include: ['openapi-consumer.ts'],
      },
      null,
      2,
    )}\n`,
  );
}

async function assertIndependentInstall(consumerDirectory) {
  for (const { name } of REUSABLE_PACKAGES) {
    const installedPath = join(consumerDirectory, 'node_modules', ...name.split('/'));
    const resolved = await realpath(installedPath);
    if (isRepoPackagePath(resolved)) {
      throw new Error(`${name} resolved to workspace source ${resolved}`);
    }

    const manifest = JSON.parse(await readFile(join(resolved, 'package.json'), 'utf8'));
    const serialized = JSON.stringify(manifest);
    if (serialized.includes('workspace:')) {
      throw new Error(`${name} installed manifest still contains workspace protocol`);
    }
  }
}

function importSpecifiersForPackage(kind, packageJson) {
  if (kind === 'json') {
    return [];
  }
  return publicImportSpecifiers(packageJson);
}

async function writeRuntimeImporter(consumerDirectory, specifiers) {
  const source = `const specifiers = ${JSON.stringify(specifiers, null, 2)};

for (const specifier of specifiers) {
  const namespace = await import(specifier);
  if (typeof namespace !== 'object' || namespace === null) {
    throw new Error(\`Expected \${specifier} to export a module namespace\`);
  }
}
`;
  const importerPath = join(consumerDirectory, 'import-public-exports.mjs');
  await writeFile(importerPath, source);
  return importerPath;
}

export async function runPackageSmoke() {
  const workDirectory = await mkdtemp(join(tmpdir(), 'client-portal-package-smoke-'));
  const tarballDirectory = join(workDirectory, 'tarballs');
  const consumerDirectory = join(workDirectory, 'consumer');

  try {
    await mkdir(tarballDirectory);
    await mkdir(consumerDirectory);

    run('pnpm', ['build:core'], rootDirectory);

    const tarballByName = new Map();
    const runtimeSpecifiers = [];

    for (const reusablePackage of REUSABLE_PACKAGES) {
      const manifest = readJson(join(rootDirectory, reusablePackage.directory, 'package.json'));
      run(
        'pnpm',
        ['--filter', reusablePackage.name, 'pack', '--pack-destination', tarballDirectory],
        rootDirectory,
      );
      const tarballPath = join(
        tarballDirectory,
        tarballFileName(reusablePackage.name, manifest.version),
      );
      if (!existsSync(tarballPath)) {
        throw new Error(`Expected tarball at ${tarballPath}`);
      }

      assertTarballContents(reusablePackage.kind, reusablePackage.name, tarballPath);
      tarballByName.set(reusablePackage.name, tarballPath);
      runtimeSpecifiers.push(...importSpecifiersForPackage(reusablePackage.kind, manifest));
    }

    await writeConsumerManifest(consumerDirectory);
    await writeConsumerSources(consumerDirectory);

    const scopedDirectory = join(consumerDirectory, 'node_modules/@client-portal');
    const extractedManifests = [];
    for (const reusablePackage of REUSABLE_PACKAGES) {
      const extractedDirectory = join(scopedDirectory, reusablePackage.name.split('/')[1]);
      await extractTarball(tarballByName.get(reusablePackage.name), extractedDirectory);
      await rewriteWorkspaceProtocol(extractedDirectory, scopedDirectory);
      extractedManifests.push(
        JSON.parse(await readFile(join(extractedDirectory, 'package.json'), 'utf8')),
      );
    }

    for (const specifier of collectHostSpecifiers(extractedManifests)) {
      await linkHostSpecifier(specifier, consumerDirectory);
    }

    await assertIndependentInstall(consumerDirectory);

    const importerPath = await writeRuntimeImporter(consumerDirectory, runtimeSpecifiers);
    run(process.execPath, [importerPath], consumerDirectory);

    const tsc = join(rootDirectory, 'node_modules/typescript/lib/tsc.js');
    for (const project of [
      'tsconfig.platform.json',
      'tsconfig.nest.json',
      'tsconfig.openapi.json',
    ]) {
      run(process.execPath, [tsc, '-p', project, '--incremental', 'false'], consumerDirectory);
    }

    process.stdout.write(
      `Package smoke passed: ${REUSABLE_PACKAGES.length} tarballs, ${runtimeSpecifiers.length} ESM imports, 3 TypeScript consumers.\n`,
    );
  } finally {
    await rm(workDirectory, { force: true, recursive: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runPackageSmoke();
}
