import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FLAGS = ['out', 'scope', 'name', 'brand', 'preset'];
const SCOPE_PATTERN = /^@[a-z0-9][a-z0-9._-]*$/;
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PORT_PATTERN = /^[0-9]+$/;
const FORBIDDEN_SCOPE = '@client-portal';
const FORBIDDEN_NAME = 'client-portal-demo';
const FORBIDDEN_BRANDS = new Set(['ПК «Нордщит»', 'Нордщит']);
const RESERVED_PORTS = new Set([3000, 3001, 5433]);
const MIN_PORT = 1024;
const MAX_PORT = 65535;
const DEFAULT_WEB_PORT = 3100;
const DEFAULT_API_PORT = 3101;
const DEFAULT_POSTGRES_PORT = 5434;

class FlagError extends Error {
  constructor(flag, message) {
    super(`${flag}: ${message}`);
    this.flag = flag;
  }
}

function flagError(flag, message) {
  throw new FlagError(flag, message);
}

function parseFlagMap(argv) {
  /** @type {Record<string, string | true>} */
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--') || argument === '--') {
      flagError(argument, 'expected a --flag');
    }
    const name = argument.slice(2);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith('--')) {
      flags[name] = true;
    } else {
      flags[name] = next;
      index += 1;
    }
  }
  return flags;
}

function requiredString(flags, name) {
  const value = flags[name];
  if (value === undefined || value === true || value.trim() === '') {
    flagError(`--${name}`, 'is required');
  }
  return value;
}

function parsePort(flags, name, fallback) {
  const raw = flags[name];
  if (raw === undefined) {
    return fallback;
  }
  if (raw === true || !PORT_PATTERN.test(raw)) {
    flagError(`--${name}`, 'must be a decimal integer');
  }
  const port = Number(raw);
  if (port < MIN_PORT || port > MAX_PORT) {
    flagError(`--${name}`, `must be an integer between ${MIN_PORT} and ${MAX_PORT}`);
  }
  if (RESERVED_PORTS.has(port)) {
    flagError(`--${name}`, 'must not reuse stand ports 3000, 3001, or 5433');
  }
  return port;
}

function resolveOutDirectory(outValue, cwd, sourceRoot) {
  const resolved = resolve(cwd, outValue);
  const sourceReal = realpathSync(sourceRoot);
  const parent = dirname(resolved);
  if (!existsSync(parent)) {
    flagError('--out', 'parent directory must exist');
  }
  const candidate = existsSync(resolved)
    ? realpathSync(resolved)
    : resolve(
        realpathSync(parent),
        resolved.slice(parent.length).replace(/^[/\\]/, '') || resolved.split(/[/\\]/).at(-1),
      );
  const relativeToSource = relative(sourceReal, candidate);
  if (
    relativeToSource === '' ||
    (!relativeToSource.startsWith('..') && !isAbsolute(relativeToSource))
  ) {
    flagError('--out', 'must be outside this git repository');
  }
  if (existsSync(resolved) && readdirSync(resolved).length > 0) {
    flagError('--out', 'must be empty or not exist');
  }
  return candidate;
}

const ALLOWLIST_A = [
  'packages/platform-core/',
  'packages/nestjs-core/',
  'packages/openapi-client-core/',
  'packages/tsconfig/',
  'packages/eslint-config/',
];

const ALLOWLIST_B = [
  '.nvmrc',
  '.node-version',
  'pnpm-workspace.yaml',
  'package.json',
  'prettier.config.mjs',
  '.prettierignore',
  'eslint.config.mjs',
  '.gitignore',
  '.dockerignore',
  'Makefile',
  'compose.yaml',
  'Dockerfile',
  '.env.example',
  '.github/workflows/ci.yml',
  '.github/actions/setup-workspace/action.yml',
  'scripts/check-boundaries.mjs',
  'scripts/check-boundaries.spec.mjs',
  'scripts/test-packages.mjs',
  'scripts/test-packages.spec.mjs',
  'scripts/free-stand-ports.mjs',
  'scripts/free-stand-ports.spec.mjs',
  'scripts/compose-smoke.mjs',
  'apps/api/package.json',
  'apps/api/tsconfig.json',
  'apps/api/tsconfig.build.json',
  'apps/api/prisma.config.ts',
  'apps/api/src/main.ts',
  'apps/api/src/app.module.ts',
  'apps/api/src/bootstrap/create-application.ts',
  'apps/api/src/core/config/api-env.ts',
  'apps/api/src/core/config/api-env.spec.ts',
  'apps/api/src/core/config/cors-origins.ts',
  'apps/api/src/core/config/cors-origins.spec.ts',
  'apps/api/src/health/',
  'apps/api/src/persistence/',
  'apps/api/src/openapi/document.ts',
  'apps/api/src/openapi/export-openapi.ts',
  'apps/api/src/openapi/openapi.contract.spec.ts',
  'apps/api/prisma/schema.prisma',
  'apps/api/prisma/seed.ts',
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'apps/web/nuxt.config.ts',
  'apps/web/app/app.vue',
  'apps/web/app/plugins/api.ts',
  'apps/web/app/layouts/default.vue',
  'apps/web/app/assets/css/main.css',
  'apps/web/app/pages/index.vue',
  'packages/api-client/package.json',
  'packages/api-client/tsconfig.json',
  'packages/api-client/src/index.ts',
  '.agents/skills/foundation-package-conventions/SKILL.md',
  '.agents/skills/nestjs-hexagonal-boundaries/SKILL.md',
  '.agents/skills/change-impact-gates/SKILL.md',
  '.agents/skills/prisma-persistence-boundary/SKILL.md',
  '.agents/skills/nuxt-ssr-data-and-ui/SKILL.md',
  '.agents/skills/verification-honesty/SKILL.md',
  '.agents/skills/git-delivery/SKILL.md',
  '.agents/skills/docker-reclaim-space/SKILL.md',
];

const ALLOWLIST_C = [
  'apps/api/src/requests/requests.module.ts',
  'apps/api/src/requests/public.ts',
  'apps/api/src/requests/http/request-portal.controller.ts',
  'apps/api/src/requests/http/request.dto.ts',
  'apps/api/src/requests/http/capability-cache-control.interceptor.ts',
  'apps/api/src/requests/http/portal-throttle.ts',
  'apps/api/src/requests/http/map-application-error.ts',
  'apps/api/src/requests/application/get-request-by-access-secret.use-case.ts',
  'apps/api/src/requests/application/get-request-by-access-secret.use-case.spec.ts',
  'apps/api/src/requests/application/request-not-found.error.ts',
  'apps/api/src/requests/application/request-query.port.ts',
  'apps/api/src/requests/domain/request.ts',
  'apps/api/src/requests/domain/request-status.ts',
  'apps/api/src/requests/domain/request-stages.ts',
  'apps/api/src/requests/domain/request-stages.spec.ts',
  'apps/api/src/requests/domain/request-file-spec-lines.spec.ts',
  'apps/api/src/requests/infrastructure/prisma-request.repository.ts',
  'apps/api/src/requests/infrastructure/prisma-request.mapper.ts',
  'apps/api/src/requests/infrastructure/apply-request-seed.ts',
  'apps/web/app/pages/r/[accessSecret]/index.vue',
  'apps/web/app/pages/r/[accessSecret]/d/[fileName].vue',
  'apps/web/app/composables/useRequestPortal.ts',
  'apps/web/app/utils/async-data-problem.ts',
  'apps/web/app/utils/request-file-display.ts',
  'apps/web/app/utils/request-next-step.ts',
  'apps/web/app/utils/request-portal-cache-key.ts',
  'apps/web/app/utils/route-param-value.ts',
  'apps/web/tests/async-data-problem.spec.ts',
  'apps/web/tests/request-file-display.spec.ts',
  'apps/web/tests/request-next-step.spec.ts',
  'apps/web/tests/request-portal-cache-key.spec.ts',
  'apps/web/tests/route-param-value.spec.ts',
];

const DENYLIST = [
  'apps/api/src/requests/domain/request-catalog.ts',
  'apps/api/src/requests/domain/live-request-fixture.ts',
  'apps/api/src/requests/http/demo-links.controller.ts',
  'apps/api/src/requests/http/demo-conductor.controller.ts',
  'apps/api/src/requests/application/get-demo-links.use-case.ts',
  'apps/api/src/requests/application/get-demo-links.use-case.spec.ts',
  'apps/api/src/requests/application/get-conductor-snapshot.use-case.ts',
  'apps/api/src/requests/application/advance-live-request.use-case.ts',
  'apps/api/src/requests/application/reset-live-request.use-case.ts',
  'apps/api/src/requests/application/load-live-request-for-conductor.ts',
  'apps/api/src/requests/application/load-live-request-for-conductor.spec.ts',
  'apps/api/src/requests/application/conductor-auth.port.ts',
  'apps/api/src/requests/application/request-live-command.port.ts',
  'apps/api/src/requests/application/live-request-advance-conflict.error.ts',
  'apps/api/src/requests/application/request-fixture-mismatch.error.ts',
  'apps/api/src/requests/infrastructure/env-conductor-auth.ts',
  'apps/api/prisma/migrations/',
  'apps/web/app/pages/start.vue',
  'apps/web/app/pages/c/',
  'apps/web/app/utils/live-cabinet-poll.ts',
  'apps/web/app/utils/bind-live-cabinet-poll.ts',
  'apps/web/tests/live-cabinet-poll.spec.ts',
  'apps/web/tests/bind-live-cabinet-poll.spec.ts',
  'apps/web/server/api/start-request.post.ts',
  'apps/web/server/api/conductor/',
  'packages/api-client/openapi.json',
  'packages/api-client/src/schema.d.ts',
  'packages/api-client/src/index.spec.ts',
  'scripts/lifecycle-targets.spec.mjs',
  'e2e/',
  'playwright.config.ts',
  'docs/llm/feature-NN.md',
  'docs/ux/',
  'docs/source-brief.md',
  'docs/demo-scenarios.md',
  'docs/domain-model.md',
  'docs/implementation-status.md',
  '.agents/skills/implement-review-cycle/',
  '.agents/skills/pr-review/',
  '.agents/skills/github-remote/',
  'pnpm-lock.yaml',
  '.env',
  'node_modules/',
  'dist/',
  'apps/api/src/generated/',
];

const THEATER_TOKENS = [
  'З-1004',
  'demoLive',
  'REQUEST_CATALOG',
  'DEMO_CONDUCTOR_SECRET',
  'seed-z100',
  'seed-demo-conductor-nordshield',
  'Ссылки для показа',
];

function normalizePath(path) {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

export function isTheaterPath(path) {
  const normalized = normalizePath(path);
  if (/(?:^|\/)docs\/llm\/feature-\d+\.md$/.test(normalized)) {
    return true;
  }

  return DENYLIST.some((entry) => {
    const item = normalizePath(entry);
    if (item.endsWith('/')) {
      return normalized === item.slice(0, -1) || normalized.startsWith(item);
    }
    if (normalized === item || normalized.endsWith(`/${item}`)) {
      return true;
    }
    const baseName = item.split('/').at(-1) ?? item;
    if (!normalized.includes('/') && normalized === baseName) {
      return true;
    }
    return item.endsWith(`/${normalized}`);
  });
}

export function collectTheaterLeaks(source) {
  return THEATER_TOKENS.filter((token) => source.includes(token));
}

function replaceWholeNumber(source, from, to) {
  if (from === to) {
    return source;
  }
  return source.replaceAll(new RegExp(`\\b${from}\\b`, 'g'), String(to));
}

export function rewriteTokens(source, config) {
  let rewritten = source.replaceAll('@client-portal', config.scope);
  rewritten = rewritten.replaceAll('client-portal-demo', config.name);
  rewritten = rewritten.replaceAll('ПК «Нордщит»', config.brand);
  if (config.dbName) {
    rewritten = rewritten.replaceAll('client_portal', config.dbName);
  }
  rewritten = replaceWholeNumber(rewritten, 5433, config.postgresPort);
  rewritten = replaceWholeNumber(rewritten, 3001, config.apiPort);
  rewritten = replaceWholeNumber(rewritten, 3000, config.webPort);
  return rewritten;
}

export function parseArgs(argv, context = {}) {
  const cwd = context.cwd ?? process.cwd();
  const sourceRoot = context.sourceRoot ?? rootDirectory;
  const flags = parseFlagMap(argv);

  for (const name of REQUIRED_FLAGS) {
    if (!(name in flags) || flags[name] === true) {
      flagError(`--${name}`, 'is required');
    }
  }

  const known = new Set([...REQUIRED_FLAGS, 'web-port', 'api-port', 'postgres-port']);
  for (const name of Object.keys(flags)) {
    if (!known.has(name)) {
      flagError(`--${name}`, 'is not a supported flag');
    }
  }

  const outValue = requiredString(flags, 'out');
  const scope = requiredString(flags, 'scope');
  const name = requiredString(flags, 'name');
  const brand = requiredString(flags, 'brand').trim();
  const preset = requiredString(flags, 'preset');

  if (preset !== 'core' && preset !== 'portal') {
    flagError('--preset', 'must be core or portal');
  }
  if (!SCOPE_PATTERN.test(scope) || scope === FORBIDDEN_SCOPE) {
    flagError('--scope', 'must be a lowercase npm scope other than @client-portal');
  }
  if (!NAME_PATTERN.test(name) || name === FORBIDDEN_NAME) {
    flagError('--name', 'must be a kebab-case name other than client-portal-demo');
  }
  if (brand.length === 0 || FORBIDDEN_BRANDS.has(brand)) {
    flagError('--brand', 'must be a non-empty brand other than Нордщит');
  }

  const webPort = parsePort(flags, 'web-port', DEFAULT_WEB_PORT);
  const apiPort = parsePort(flags, 'api-port', DEFAULT_API_PORT);
  const postgresPort = parsePort(flags, 'postgres-port', DEFAULT_POSTGRES_PORT);
  if (webPort === apiPort || webPort === postgresPort || apiPort === postgresPort) {
    flagError('--web-port', 'web, api, and postgres ports must be pairwise distinct');
  }

  const outDir = resolveOutDirectory(outValue, cwd, sourceRoot);

  return {
    apiPort,
    brand,
    cwd,
    dbName: name.replaceAll('-', '_'),
    name,
    outDir,
    postgresPort,
    preset,
    scope,
    sourceRoot,
    webPort,
  };
}

function matchesAllowlistEntry(path, entry) {
  if (entry.endsWith('/')) {
    return path === entry.slice(0, -1) || path.startsWith(entry);
  }
  return path === entry;
}

function isDenylistPath(path) {
  const normalized = normalizePath(path);
  if (/(?:^|\/)docs\/llm\/feature-\d+\.md$/.test(normalized)) {
    return true;
  }
  if (normalized.split('/').some((part) => part === 'node_modules' || part === 'dist')) {
    return true;
  }
  return DENYLIST.some((entry) => {
    const item = normalizePath(entry);
    if (item.endsWith('/')) {
      return normalized === item.slice(0, -1) || normalized.startsWith(item);
    }
    return normalized === item;
  });
}

function isAllowlisted(path, preset) {
  const lists = [...ALLOWLIST_A, ...ALLOWLIST_B, ...(preset === 'portal' ? ALLOWLIST_C : [])];
  return lists.some((entry) => matchesAllowlistEntry(path, entry));
}

function gitTrackedFiles(sourceRoot) {
  const output = execFileSync('git', ['ls-files', '-z'], { cwd: sourceRoot });
  return output
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map((path) => normalizePath(path));
}

function listDestFiles(directory, prefix = '') {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory() || statSync(absolutePath).isDirectory()) {
      files.push(...listDestFiles(absolutePath, relativePath));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

function rewriteAppModule(preset) {
  if (preset === 'core') {
    return `import { PlatformLoggingModule } from '@client-portal/nestjs-core/logging';
import { provideProblemDetailsFilter } from '@client-portal/nestjs-core/problem-details';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateApiEnv } from './core/config/api-env.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateApiEnv,
    }),
    PlatformLoggingModule.forRoot(),
    HealthModule,
  ],
  providers: [provideProblemDetailsFilter({ typeBaseUrl: 'https://demo.local/problems' })],
})
export class AppModule {}
`;
  }

  return `import { PlatformLoggingModule } from '@client-portal/nestjs-core/logging';
import { provideProblemDetailsFilter } from '@client-portal/nestjs-core/problem-details';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validateApiEnv } from './core/config/api-env.js';
import { HealthModule } from './health/health.module.js';
import { portalThrottlerModuleOptions } from './requests/http/portal-throttle.js';
import { RequestsModule } from './requests/requests.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateApiEnv,
    }),
    PlatformLoggingModule.forRoot(),
    ThrottlerModule.forRoot(portalThrottlerModuleOptions()),
    HealthModule,
    RequestsModule,
  ],
  providers: [
    provideProblemDetailsFilter({ typeBaseUrl: 'https://demo.local/problems' }),
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
`;
}

function rewriteCreateApplication() {
  return `import {
  configureBaseFastifyApplication,
  createCorrelatedFastifyAdapter,
} from '@client-portal/nestjs-core/bootstrap';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../app.module.js';
import type { ApiEnv } from '../core/config/api-env.js';
import { corsOriginsFromWebOrigin } from '../core/config/cors-origins.js';
import { ReadinessService } from '../health/readiness.service.js';

export async function createApplication(): Promise<NestFastifyApplication> {
  const adapter = createCorrelatedFastifyAdapter();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService<ApiEnv, true>);

  await configureBaseFastifyApplication(app, { globalPrefix: 'api/v1' });
  app.enableCors({
    credentials: false,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    origin: corsOriginsFromWebOrigin(config.get('WEB_ORIGIN', { infer: true })),
  });
  const readiness = app.get(ReadinessService);
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onClose', (_instance, done) => {
      readiness.markNotReady();
      done();
    });
  return app;
}
`;
}

function rewriteApiEnv(source) {
  return source.replace('  DEMO_CONDUCTOR_SECRET: z.string().min(1),\n', '');
}

function rewriteApiEnvSpec() {
  return `import { describe, expect, it } from 'vitest';

import { validateApiEnv } from './api-env.js';

const validEnv = {
  API_PORT: '3001',
  DATABASE_URL: 'postgresql://client_portal:client_portal@127.0.0.1:5433/client_portal',
  NODE_ENV: 'test',
  WEB_ORIGIN: 'http://localhost:3000',
};

describe('validateApiEnv', () => {
  it('accepts the boilerplate environment', () => {
    expect(validateApiEnv(validEnv)).toMatchObject({
      API_PORT: 3001,
      DATABASE_URL: validEnv.DATABASE_URL,
      NODE_ENV: 'test',
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('rejects the boilerplate environment without DATABASE_URL', () => {
    expect(() =>
      validateApiEnv({
        API_PORT: validEnv.API_PORT,
        NODE_ENV: validEnv.NODE_ENV,
        WEB_ORIGIN: validEnv.WEB_ORIGIN,
      }),
    ).toThrow(/Invalid API environment/);
  });

  it('rejects a WEB_ORIGIN with a path', () => {
    expect(() => validateApiEnv({ ...validEnv, WEB_ORIGIN: 'http://localhost:3000/app' })).toThrow(
      /Invalid API environment/,
    );
  });
});
`;
}

function rewriteHealthHttpSpec(source) {
  return source.replace(
    "  process.env.DEMO_CONDUCTOR_SECRET = 'seed-demo-conductor-nordshield';\n",
    '',
  );
}

function rewriteDocument(source) {
  return source.replace(".setTitle('ПК «Нордщит» — кабинет заявки')", ".setTitle('ПК «Нордщит»')");
}

function rewriteExportOpenapi(preset) {
  const portalAssert =
    preset === 'portal'
      ? `
  if (document.paths?.['/requests/{accessSecret}'] === undefined) {
    throw new Error('OpenAPI is missing path /requests/{accessSecret}');
  }`
      : `
  if (document.paths?.['/requests/{accessSecret}'] !== undefined) {
    throw new Error('OpenAPI must not include request portal paths in the core preset');
  }`;

  return `import 'reflect-metadata';

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createApplication } from '../bootstrap/create-application.js';
import { buildOpenApiDocument } from './document.js';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../');
const outputPath = resolve(workspaceRoot, 'packages/api-client/openapi.json');

function assertContract(document: {
  readonly paths?: Record<string, unknown>;
  readonly servers?: readonly { readonly url?: string }[];
}): void {
  const serverUrl = document.servers?.[0]?.url ?? '';
  if (!serverUrl.includes('/api/v1')) {
    throw new Error(\`OpenAPI servers[0].url must contain /api/v1, received \${serverUrl}\`);
  }
  if (document.paths?.['/health/live'] === undefined) {
    throw new Error('OpenAPI is missing path /health/live');
  }
  if (document.paths?.['/health/ready'] === undefined) {
    throw new Error('OpenAPI is missing path /health/ready');
  }
  if (document.paths?.['/demo/links'] !== undefined) {
    throw new Error('OpenAPI must not include theater demo paths');
  }
  if (document.paths?.['/demo/conductor/{conductorSecret}'] !== undefined) {
    throw new Error('OpenAPI must not include theater conductor paths');
  }${portalAssert}
}

const app = await createApplication();
try {
  const document = buildOpenApiDocument(app);
  assertContract(document);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, \`\${JSON.stringify(document, null, 2)}\\n\`);
} finally {
  await app.close();
}
`;
}

function rewriteOpenapiContractSpec(preset) {
  const portalCases =
    preset === 'portal'
      ? `
  it('documents request portal JSON bodies and problem+json failures', () => {
    expect(responseContentTypes(document, '/requests/{accessSecret}', '404')).toEqual([
      'application/problem+json',
    ]);
    expect(responseContentTypes(document, '/requests/{accessSecret}', '429')).toEqual([
      'application/problem+json',
    ]);
  });

  it('declares spec quantity and file byteSize as integers', () => {
    expect(schemaPropertyType(document, 'RequestSpecLineDto', 'quantity')).toBe('integer');
    expect(schemaPropertyType(document, 'RequestFileDto', 'byteSize')).toBe('integer');
  });
`
      : '';

  return `import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const openapiPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../packages/api-client/openapi.json',
);

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new Error('expected object');
  }

  return value as Record<string, unknown>;
}

function schemaProperty(
  document: Record<string, unknown>,
  schemaName: string,
  property: string,
): Record<string, unknown> {
  const components = asRecord(document.components);
  const schemas = asRecord(components.schemas);
  const schema = asRecord(schemas[schemaName]);
  const properties = asRecord(schema.properties);

  return asRecord(properties[property]);
}

function schemaPropertyType(
  document: Record<string, unknown>,
  schemaName: string,
  property: string,
): unknown {
  return schemaProperty(document, schemaName, property).type;
}

function responseContentTypes(
  document: Record<string, unknown>,
  path: string,
  status: string,
  method: string = 'get',
): string[] {
  const paths = asRecord(document.paths);
  const item = asRecord(paths[path]);
  const operation = asRecord(item[method]);
  const responses = asRecord(operation.responses);
  const response = asRecord(responses[status]);
  if (!('content' in response) || response.content === undefined) {
    return [];
  }

  return Object.keys(asRecord(response.content));
}

describe('OpenAPI contract for generated client', () => {
  const document = asRecord(JSON.parse(readFileSync(openapiPath, 'utf8')) as unknown);

  it('documents health JSON bodies and problem+json failures', () => {
    expect(responseContentTypes(document, '/health/live', '200')).toContain('application/json');
    expect(responseContentTypes(document, '/health/ready', '200')).toContain('application/json');
    expect(responseContentTypes(document, '/health/ready', '503')).toContain(
      'application/problem+json',
    );
  });

  it('does not document theater demo or conductor paths', () => {
    const paths = asRecord(document.paths);
    expect(paths['/demo/links']).toBeUndefined();
    expect(paths['/demo/conductor/{conductorSecret}']).toBeUndefined();
  });
${portalCases}});
`;
}

function rewriteNuxtConfig(source, preset) {
  let rewritten = source.replace("    '/start': { headers: capabilityPageHeaders },\n", '');
  rewritten = rewritten.replace("    '/c/**': { headers: capabilityPageHeaders },\n", '');
  if (preset === 'core') {
    rewritten = rewritten.replace("    '/r/**': { headers: capabilityPageHeaders },\n", '');
  }
  rewritten = rewritten.replace("    demoConductorSecret: '',\n", '');
  return rewritten;
}

function rewriteIndexPage() {
  return `<script setup lang="ts">
import { useSeoMeta } from 'nuxt/app';

useSeoMeta({
  title: 'ПК «Нордщит»',
});
</script>

<template>
  <main>
    <h1 class="document-display">Кабинет заявки</h1>
    <p class="mt-3 text-ink">Откройте ссылку, которую менеджер отправил заказчику.</p>
  </main>
</template>
`;
}

function rewriteSeed(preset) {
  if (preset === 'core') {
    return `async function seed() {}

await seed();
`;
  }

  return `import { applyRequestSeed } from '../src/requests/infrastructure/apply-request-seed.js';

export { applyRequestSeed };

await applyRequestSeed();
`;
}

function rewritePrismaSchema(source, preset) {
  if (preset === 'core') {
    return `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model RuntimeProbe {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @db.Timestamptz
}
`;
  }

  return source.replace(
    '  /// Fixture timestamps are part of the demo catalog; set explicitly instead of @updatedAt.\n',
    '',
  );
}

function rewriteCompose(source) {
  let rewritten = source.replaceAll('client-portal-postgres', 'client-portal-demo-postgres');
  rewritten = rewritten.replaceAll('client-portal-api', 'client-portal-demo-api');
  rewritten = rewritten.replaceAll('client-portal-web', 'client-portal-demo-web');
  rewritten = rewritten.replace(/^\s*DEMO_CONDUCTOR_SECRET:.*\n/gm, '');
  rewritten = rewritten.replace(/^\s*NUXT_DEMO_CONDUCTOR_SECRET:.*\n/gm, '');
  return rewritten;
}

function rewriteEnvExample(source) {
  return source
    .replace(/^DEMO_CONDUCTOR_SECRET=.*\n/m, '')
    .replace(/^NUXT_DEMO_CONDUCTOR_SECRET=.*\n/m, '');
}

function rewriteCi(source) {
  let rewritten = source.replace(/^\s*DEMO_CONDUCTOR_SECRET:.*\n/gm, '');
  rewritten = rewritten.replace(/^\s*NUXT_DEMO_CONDUCTOR_SECRET:.*\n/gm, '');
  rewritten = rewritten.replace(/\n {2}e2e:\n[\s\S]*$/, '\n');
  return rewritten;
}

function rewriteMakefile(source) {
  let rewritten = source.replace(/\n# Index \+ cabinet e2e[\s\S]*$/, '\n');
  rewritten = rewritten.replace(
    /\n\tnode scripts\/compose-smoke\.mjs\n\tpnpm exec playwright install --with-deps chromium\n\tpnpm test:e2e\n/,
    '\n\tnode scripts/compose-smoke.mjs\n',
  );
  return rewritten;
}

function rewriteComposeSmoke() {
  return `import { execFileSync } from 'node:child_process';
import net from 'node:net';

const readyUrl = 'http://localhost:3001/api/v1/health/ready';
const postgresPort = 5433;
const requiredContainers = [
  'client-portal-demo-postgres',
  'client-portal-demo-api',
  'client-portal-demo-web',
];

function runningContainerNames() {
  const output = execFileSync(
    'docker',
    ['ps', '--format', '{{.Names}}', '--filter', 'name=client-portal-demo-'],
    { encoding: 'utf8' },
  );
  return new Set(
    output
      .split('\\n')
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

function assertComposeStand() {
  const running = runningContainerNames();
  for (const name of requiredContainers) {
    if (!running.has(name)) {
      throw new Error(\`compose stand is missing running container \${name}\`);
    }
  }
}

function assertTcpOpen(port) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.end();
      resolve();
    });
    socket.once('error', (error) => {
      reject(new Error(\`Postgres on 127.0.0.1:\${port} is not reachable: \${error.message}\`));
    });
  });
}

async function main() {
  assertComposeStand();
  await assertTcpOpen(postgresPort);

  const readyResponse = await fetch(readyUrl);
  if (readyResponse.status !== 200) {
    throw new Error(\`\${readyUrl} expected 200, got \${readyResponse.status}\`);
  }

  const readyBody = await readyResponse.json();
  if (readyBody?.data?.status !== 'ok') {
    throw new Error(\`\${readyUrl} payload was not ready: \${JSON.stringify(readyBody)}\`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
`;
}

function rewriteRootPackageJson(source) {
  const pkg = JSON.parse(source);
  delete pkg.scripts['test:e2e'];
  if (pkg.devDependencies !== undefined) {
    delete pkg.devDependencies['@playwright/test'];
  }
  if (typeof pkg.scripts.test === 'string') {
    pkg.scripts.test = pkg.scripts.test.replace(' scripts/lifecycle-targets.spec.mjs', '');
  }
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

function rewriteRequestsModule() {
  return `import { Module } from '@nestjs/common';

import { PrismaModule } from '../persistence/prisma.module.js';
import { GetRequestByAccessSecretUseCase } from './application/get-request-by-access-secret.use-case.js';
import { REQUEST_QUERY } from './application/request-query.port.js';
import { RequestPortalController } from './http/request-portal.controller.js';
import { PrismaRequestRepository } from './infrastructure/prisma-request.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [RequestPortalController],
  providers: [
    GetRequestByAccessSecretUseCase,
    PrismaRequestRepository,
    { provide: REQUEST_QUERY, useExisting: PrismaRequestRepository },
  ],
})
export class RequestsModule {}
`;
}

function rewriteMapApplicationError() {
  return `import { NotFoundException } from '@nestjs/common';

import { RequestNotFoundError } from '../application/request-not-found.error.js';

export function mapApplicationError(error: unknown): never {
  if (error instanceof RequestNotFoundError) {
    throw new NotFoundException('The requested resource was not found');
  }

  throw error;
}
`;
}

function rewriteRequestDomain(source) {
  return source
    .replace(/\nexport interface DemoLink \{[\s\S]*?\}\n/, '\n')
    .replace('\n  readonly demoLive?: true;\n', '\n')
    .replace(/\nexport interface ConductorSnapshot \{[\s\S]*?\}\n/, '\n');
}

function rewriteGetRequestUseCase(source) {
  return source
    .replace("import { isLiveRequestPublicNumber } from '../domain/live-request-fixture.js';\n", '')
    .replace(
      '      files: record.files,\n      ...(isLiveRequestPublicNumber(record.publicNumber) ? { demoLive: true as const } : {}),\n',
      '      files: record.files,\n',
    );
}

function rewriteGetRequestUseCaseSpec() {
  return `import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';
import { describe, expect, it } from 'vitest';

import { RequestNotFoundError } from './request-not-found.error.js';
import type { RequestQueryPort, RequestRecord } from './request-query.port.js';
import { GetRequestByAccessSecretUseCase } from './get-request-by-access-secret.use-case.js';

const FIXTURE_SECRET = 'seed-quote-example';

function quoteRecord(accessSecretHash: string): RequestRecord {
  return {
    publicNumber: 'A-1043',
    counterpartyName: 'Example counterparty',
    title: 'ВРУ 400 А',
    status: 'quote_ready',
    updatedAt: '2026-09-04T12:00:00.000Z',
    accessSecretHash,
    specLines: [
      {
        name: 'Вводно-распределительное устройство 400 А',
        quantity: 1,
        unit: 'шт',
        comment: 'IP54, навесное',
      },
      { name: 'Рубильник ввода', quantity: 1, unit: 'шт' },
    ],
    files: [
      {
        fileName: 'quote-A-1043.pdf',
        kind: 'quote',
        byteSize: 240000,
        uploadedAt: '2026-09-04T12:00:00.000Z',
        specLines: [
          {
            name: 'Вводно-распределительное устройство 400 А',
            quantity: 1,
            unit: 'шт',
            comment: 'IP54, навесное',
          },
          { name: 'Рубильник ввода', quantity: 1, unit: 'шт' },
        ],
      },
    ],
    stageHistory: [
      { status: 'accepted', reachedAt: '2026-09-01T09:00:00.000Z' },
      { status: 'in_calculation', reachedAt: '2026-09-02T11:00:00.000Z' },
      { status: 'quote_ready', reachedAt: '2026-09-04T12:00:00.000Z' },
    ],
  };
}

describe('GetRequestByAccessSecretUseCase', () => {
  it('looks up by hashOpaqueToken and does not put the hash in the portal view', async () => {
    const hash = hashOpaqueToken(FIXTURE_SECRET);
    const lookups: string[] = [];
    const port: RequestQueryPort = {
      listRequestSummaries: async () => [],
      findByAccessSecretHash: async (value) => {
        lookups.push(value);
        return value === hash ? quoteRecord(hash) : null;
      },
    };
    const useCase = new GetRequestByAccessSecretUseCase(port);

    const result = await useCase.execute(FIXTURE_SECRET);

    expect(lookups).toEqual([hash]);
    expect(lookups).not.toContain(FIXTURE_SECRET);
    expect(result.status).toBe('quote_ready');
    expect(result.stages).toHaveLength(4);
    expect(JSON.stringify(result)).not.toContain(hash);
    expect(result).not.toHaveProperty('accessSecretHash');
  });

  it('throws a typed not-found error for an unknown secret', async () => {
    const port: RequestQueryPort = {
      listRequestSummaries: async () => [],
      findByAccessSecretHash: async () => null,
    };
    const useCase = new GetRequestByAccessSecretUseCase(port);

    await expect(useCase.execute('unknown-secret-not-in-seed')).rejects.toBeInstanceOf(
      RequestNotFoundError,
    );
  });
});
`;
}

function rewriteRequestDto() {
  return `import { TraceMetaDto } from '@client-portal/nestjs-core/openapi';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { REQUEST_FILE_KINDS, REQUEST_STATUSES } from '../domain/request-status.js';

export class RequestStageDto {
  @ApiProperty({ enum: REQUEST_STATUSES, type: String })
  status!: string;

  @ApiProperty({ example: 'Принят', type: String })
  label!: string;

  @ApiProperty({
    example: '2026-09-01T09:00:00.000Z',
    format: 'date-time',
    nullable: true,
    type: String,
  })
  reachedAt!: string | null;
}

export class RequestSpecLineDto {
  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: 'integer', example: 1, format: 'int32' })
  quantity!: number;

  @ApiProperty({ example: 'шт', type: String })
  unit!: string;

  @ApiPropertyOptional({ example: 'IP54, навесное', type: String })
  comment?: string;
}

export class RequestFileDto {
  @ApiProperty({ example: 'quote-A-1043.pdf', type: String })
  fileName!: string;

  @ApiProperty({ enum: REQUEST_FILE_KINDS, type: String })
  kind!: string;

  @ApiProperty({ type: 'integer', example: 240000, format: 'int32' })
  byteSize!: number;

  @ApiProperty({ example: '2026-09-04T12:00:00.000Z', format: 'date-time', type: String })
  uploadedAt!: string;

  @ApiProperty({
    type: () => RequestSpecLineDto,
    isArray: true,
    maxItems: 5,
    minItems: 2,
  })
  specLines!: RequestSpecLineDto[];
}

export class RequestPortalDataDto {
  @ApiProperty({ example: 'A-1043', type: String })
  publicNumber!: string;

  @ApiProperty({ example: 'Example counterparty', type: String })
  counterpartyName!: string;

  @ApiProperty({ example: 'ВРУ 400 А', type: String })
  title!: string;

  @ApiProperty({ enum: REQUEST_STATUSES, example: 'quote_ready', type: String })
  status!: string;

  @ApiProperty({ example: 'КП готово', type: String })
  statusLabel!: string;

  @ApiProperty({ example: '2026-09-04T12:00:00.000Z', format: 'date-time', type: String })
  updatedAt!: string;

  @ApiProperty({ example: 'ПК «Нордщит»', type: String })
  plantName!: string;

  @ApiProperty({
    type: () => RequestStageDto,
    isArray: true,
    maxItems: 4,
    minItems: 4,
  })
  stages!: RequestStageDto[];

  @ApiProperty({
    type: () => RequestSpecLineDto,
    isArray: true,
    maxItems: 5,
    minItems: 2,
  })
  specLines!: RequestSpecLineDto[];

  @ApiProperty({ type: () => RequestFileDto, isArray: true })
  files!: RequestFileDto[];
}

export class RequestPortalResponseDto {
  @ApiProperty({ type: () => RequestPortalDataDto })
  data!: RequestPortalDataDto;

  @ApiProperty({ type: () => TraceMetaDto })
  meta!: TraceMetaDto;
}
`;
}

function rewriteApplyRequestSeed() {
  return `export async function applyRequestSeed(): Promise<void> {}
`;
}

function rewritePrismaRequestRepository() {
  return `import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../persistence/prisma.service.js';
import type { RequestQueryPort } from '../application/request-query.port.js';
import type { RequestRecord, RequestSummary } from '../domain/request.js';
import { mapRequestRecord, mapRequestSummary } from './prisma-request.mapper.js';

const requestInclude = {
  specLines: { orderBy: { position: 'asc' as const } },
  files: {
    orderBy: { position: 'asc' as const },
    include: { specLines: { orderBy: { position: 'asc' as const } } },
  },
  stageHistory: true,
};

const requestSummarySelect = {
  publicNumber: true,
  counterpartyName: true,
  title: true,
  status: true,
  updatedAt: true,
  accessSecretHash: true,
} as const;

@Injectable()
export class PrismaRequestRepository implements RequestQueryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listRequestSummaries(): Promise<readonly RequestSummary[]> {
    const rows = await this.prisma.asClient().request.findMany({
      orderBy: { publicNumber: 'asc' },
      select: requestSummarySelect,
    });
    return rows.map(mapRequestSummary);
  }

  async findByAccessSecretHash(accessSecretHash: string): Promise<RequestRecord | null> {
    const row = await this.prisma.asClient().request.findUnique({
      include: requestInclude,
      where: { accessSecretHash },
    });
    return row === null ? null : mapRequestRecord(row);
  }
}
`;
}

function rewriteRequestFileSpecLinesSpec() {
  return `import { describe, expect, it } from 'vitest';

type SpecLineLike = {
  readonly name?: string;
  readonly quantity?: number;
  readonly unit?: string;
};

function specLineIdentity(lines: unknown): string {
  if (!Array.isArray(lines)) {
    return '';
  }

  return [...lines]
    .map((line) => {
      const rec = line as SpecLineLike;
      return \`\${String(rec.name)}|\${String(rec.quantity)}|\${String(rec.unit)}\`;
    })
    .sort()
    .join('||');
}

describe('request file spec lines', () => {
  it('gives each file kind a distinct table and keeps cabinet specLines', () => {
    const cabinet = [
      { name: 'Щит управления теплицами', quantity: 1, unit: 'комплект' },
      { name: 'Шкаф частотников', quantity: 1, unit: 'шт' },
    ];
    const files = [
      {
        kind: 'questionnaire',
        specLines: [
          { name: 'Щит управления теплицами', quantity: 1, unit: 'шт' },
          { name: 'Частотники полива', quantity: 3, unit: 'шт' },
        ],
      },
      {
        kind: 'quote',
        specLines: [
          { name: 'Щит управления теплицами', quantity: 1, unit: 'комплект' },
          { name: 'Шкаф частотников', quantity: 1, unit: 'шт' },
          { name: 'Пульт диспетчера', quantity: 1, unit: 'шт' },
        ],
      },
      {
        kind: 'invoice',
        specLines: [
          { name: 'Щит управления теплицами', quantity: 1, unit: 'комплект' },
          { name: 'Шкаф частотников', quantity: 1, unit: 'шт' },
        ],
      },
    ] as const;

    const identities = files.map((file) => specLineIdentity(file.specLines));
    expect(new Set(identities).size).toBe(3);
    expect(specLineIdentity(cabinet)).toEqual(specLineIdentity(files[2].specLines));
  });
});
`;
}

function rewriteUseRequestPortal() {
  return `import { createError, useAsyncData, useNuxtApp, useRoute } from 'nuxt/app';
import { computed } from 'vue';

import {
  asyncDataProblemPayload,
  statusCodeFromAsyncDataError,
  statusCodeFromThrown,
  traceIdFromAsyncDataError,
} from '~/utils/async-data-problem';
import { requestPortalCacheKey } from '~/utils/request-portal-cache-key';
import { routeParamValue } from '~/utils/route-param-value';

export async function useRequestPortal() {
  const { $api } = useNuxtApp();
  const route = useRoute();
  const accessSecret = computed(() => routeParamValue(route.params.accessSecret));

  const { data, error, status } = await useAsyncData(
    () => requestPortalCacheKey(accessSecret.value),
    async () => {
      const secret = accessSecret.value;
      try {
        const response = await $api.GET('/requests/{accessSecret}', {
          params: { path: { accessSecret: secret } },
        });
        const portal = response.data?.data;
        if (!portal) {
          throw new Error('Request portal response is missing data');
        }
        return portal;
      } catch (caught) {
        const payload = asyncDataProblemPayload(caught);
        throw createError({
          cause: caught,
          message: 'Не удалось загрузить заявку.',
          statusCode: statusCodeFromThrown(caught),
          ...(payload === undefined ? {} : { data: payload }),
        });
      }
    },
    {
      watch: [() => route.params.accessSecret],
    },
  );

  const request = computed(() => data.value);
  const errorTraceId = computed(() => traceIdFromAsyncDataError(error.value));
  const isNotFound = computed(() => statusCodeFromAsyncDataError(error.value, 0) === 404);

  return {
    accessSecret,
    error,
    errorTraceId,
    isNotFound,
    request,
    status,
  };
}
`;
}

function rewriteCabinetPage(source) {
  return source
    .replace(
      "import { LIVE_CABINET_POLL_HINT, shouldPollLiveCabinet } from '~/utils/live-cabinet-poll';\n",
      '',
    )
    .replace(
      '\nconst showLivePollHint = computed(() => shouldPollLiveCabinet(request.value));\n',
      '\n',
    )
    .replace(
      '\n      <p v-if="showLivePollHint" class="mt-4 text-ink">{{ LIVE_CABINET_POLL_HINT }}</p>\n',
      '\n',
    );
}

function rewriteWebFixtureTokens(source) {
  return source
    .replaceAll('seed-z10043-quote-kuznetsov', 'seed-quote-example')
    .replaceAll('КП-З-10043.pdf', 'quote-A-1043.pdf');
}

function rewriteMixedFile(relativePath, source, options) {
  switch (relativePath) {
    case 'apps/api/src/app.module.ts':
      return rewriteAppModule(options.preset);
    case 'apps/api/src/bootstrap/create-application.ts':
      return rewriteCreateApplication();
    case 'apps/api/src/core/config/api-env.ts':
      return rewriteApiEnv(source);
    case 'apps/api/src/core/config/api-env.spec.ts':
      return rewriteApiEnvSpec();
    case 'apps/api/src/health/health.http.spec.ts':
      return rewriteHealthHttpSpec(source);
    case 'apps/api/src/openapi/document.ts':
      return rewriteDocument(source);
    case 'apps/api/src/openapi/export-openapi.ts':
      return rewriteExportOpenapi(options.preset);
    case 'apps/api/src/openapi/openapi.contract.spec.ts':
      return rewriteOpenapiContractSpec(options.preset);
    case 'apps/web/nuxt.config.ts':
      return rewriteNuxtConfig(source, options.preset);
    case 'apps/web/app/pages/index.vue':
      return rewriteIndexPage();
    case 'apps/api/prisma/seed.ts':
      return rewriteSeed(options.preset);
    case 'apps/api/prisma/schema.prisma':
      return rewritePrismaSchema(source, options.preset);
    case 'compose.yaml':
      return rewriteCompose(source);
    case '.env.example':
      return rewriteEnvExample(source);
    case '.github/workflows/ci.yml':
      return rewriteCi(source);
    case 'Makefile':
      return rewriteMakefile(source);
    case 'scripts/compose-smoke.mjs':
      return rewriteComposeSmoke();
    case 'package.json':
      return rewriteRootPackageJson(source);
    case 'packages/platform-core/src/opaque-token.spec.ts':
      return source.replaceAll('seed-demo-conductor-nordshield', 'seed-example-token');
    case 'apps/api/src/requests/requests.module.ts':
      return rewriteRequestsModule();
    case 'apps/api/src/requests/http/map-application-error.ts':
      return rewriteMapApplicationError();
    case 'apps/api/src/requests/http/request.dto.ts':
      return rewriteRequestDto();
    case 'apps/api/src/requests/domain/request.ts':
      return rewriteRequestDomain(source);
    case 'apps/api/src/requests/application/get-request-by-access-secret.use-case.ts':
      return rewriteGetRequestUseCase(source);
    case 'apps/api/src/requests/application/get-request-by-access-secret.use-case.spec.ts':
      return rewriteGetRequestUseCaseSpec();
    case 'apps/api/src/requests/infrastructure/apply-request-seed.ts':
      return rewriteApplyRequestSeed();
    case 'apps/api/src/requests/infrastructure/prisma-request.repository.ts':
      return rewritePrismaRequestRepository();
    case 'apps/api/src/requests/domain/request-file-spec-lines.spec.ts':
      return rewriteRequestFileSpecLinesSpec();
    case 'apps/web/app/composables/useRequestPortal.ts':
      return rewriteUseRequestPortal();
    case 'apps/web/app/pages/r/[accessSecret]/index.vue':
      return rewriteCabinetPage(source);
    case 'apps/web/tests/request-file-display.spec.ts':
    case 'apps/web/tests/request-portal-cache-key.spec.ts':
    case 'apps/web/tests/route-param-value.spec.ts':
      return rewriteWebFixtureTokens(source);
    default:
      return source;
  }
}

function writePrismaMigration(options) {
  const migrationsRoot = join(options.outDir, 'apps/api/prisma/migrations');
  const initialDir = join(migrationsRoot, '00000000000000_init');
  mkdirSync(initialDir, { recursive: true });
  const schemaPath = join(options.outDir, 'apps/api/prisma/schema.prisma');
  const sql = execFileSync(
    'pnpm',
    ['exec', 'prisma', 'migrate', 'diff', '--from-empty', '--to-schema', schemaPath, '--script'],
    { cwd: join(options.sourceRoot, 'apps/api'), encoding: 'utf8' },
  );
  writeFileSync(join(migrationsRoot, 'migration_lock.toml'), 'provider = "postgresql"\n');
  writeFileSync(join(initialDir, 'migration.sql'), sql.endsWith('\n') ? sql : `${sql}\n`);
}

export async function scaffoldWorkspace(options) {
  mkdirSync(options.outDir, { recursive: true });
  const selected = gitTrackedFiles(options.sourceRoot).filter(
    (path) => isAllowlisted(path, options.preset) && !isDenylistPath(path),
  );

  for (const relativePath of selected) {
    const source = readFileSync(join(options.sourceRoot, relativePath), 'utf8');
    const destPath = join(options.outDir, relativePath);
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(
      destPath,
      rewriteTokens(rewriteMixedFile(relativePath, source, options), options),
    );
  }

  writePrismaMigration(options);

  const leaks = [];
  for (const relativePath of listDestFiles(options.outDir)) {
    const found = collectTheaterLeaks(readFileSync(join(options.outDir, relativePath), 'utf8'));
    if (found.length > 0) {
      leaks.push(`${relativePath}: ${found.join(',')}`);
    }
  }
  if (leaks.length > 0) {
    throw new Error(`theater leaks in dest:\n${leaks.join('\n')}`);
  }

  execFileSync('git', ['init', '-b', 'main'], { cwd: options.outDir });
}

function runDest(options, command, args) {
  try {
    execFileSync(command, args, {
      cwd: options.outDir,
      encoding: 'utf8',
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const detail =
      error && typeof error === 'object' && 'stderr' in error
        ? String(error.stderr || error.stdout || error.message)
        : String(error);
    throw new Error(`${command} ${args.join(' ')} failed:\n${detail}`);
  }
}

export async function finalizeWorkspace(options) {
  const envExample = readFileSync(join(options.outDir, '.env.example'), 'utf8');
  writeFileSync(join(options.outDir, '.env'), envExample);
  mkdirSync(join(options.outDir, 'packages/api-client/src'), { recursive: true });
  writeFileSync(
    join(options.outDir, 'packages/api-client/openapi.json'),
    `${JSON.stringify(
      { info: { title: options.brand, version: '0.0.0' }, openapi: '3.1.0', paths: {} },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(options.outDir, 'packages/api-client/src/schema.d.ts'),
    'export interface paths {}\nexport interface components {}\nexport interface operations {}\n',
  );

  runDest(options, 'pnpm', ['install']);
  runDest(options, 'pnpm', ['build:core']);
  runDest(options, 'pnpm', ['generate:api']);
}

async function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv, { cwd: process.cwd(), sourceRoot: rootDirectory });
    await scaffoldWorkspace(options);
    await finalizeWorkspace(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] === undefined ? undefined : resolve(process.argv[1]);
if (invokedPath !== undefined && invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
