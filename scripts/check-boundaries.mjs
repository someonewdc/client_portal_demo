import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue']);
const excludedPathParts = new Set(['.nuxt', '.output', 'coverage', 'dist', 'node_modules']);

const temporaryAllowlist = [];

function normalizePath(path) {
  return path.replaceAll('\\', '/');
}

function isTrackedSource(path) {
  const normalizedPath = normalizePath(path);
  if (normalizedPath.startsWith('apps/api/src/generated/')) {
    return false;
  }

  const parts = normalizedPath.split('/');
  if (parts.some((part) => excludedPathParts.has(part))) {
    return false;
  }

  const extension = normalizedPath.slice(normalizedPath.lastIndexOf('.'));
  return sourceExtensions.has(extension);
}

function maskComments(source) {
  let masked = '';
  let index = 0;
  let state = 'code';
  let quote = '';

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (state === 'line-comment') {
      if (character === '\n') {
        state = 'code';
        masked += '\n';
      } else {
        masked += ' ';
      }
      index += 1;
      continue;
    }

    if (state === 'block-comment') {
      if (character === '*' && next === '/') {
        masked += '  ';
        index += 2;
        state = 'code';
      } else {
        masked += character === '\n' ? '\n' : ' ';
        index += 1;
      }
      continue;
    }

    if (state === 'string') {
      masked += character;
      if (character === '\\') {
        masked += next ?? '';
        index += 2;
      } else if (character === quote) {
        state = 'code';
        quote = '';
        index += 1;
      } else {
        index += 1;
      }
      continue;
    }

    if (character === '/' && next === '/') {
      masked += '  ';
      index += 2;
      state = 'line-comment';
    } else if (character === '/' && next === '*') {
      masked += '  ';
      index += 2;
      state = 'block-comment';
    } else if (character === '"' || character === "'" || character === '`') {
      masked += character;
      quote = character;
      state = 'string';
      index += 1;
    } else {
      masked += character;
      index += 1;
    }
  }

  return masked;
}

function extractImports(source) {
  const imports = [];
  const uncommentedSource = maskComments(source);
  const patterns = [
    /\bimport\s+(?!\()(?:(?:type\s+)?[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of uncommentedSource.matchAll(pattern)) {
      imports.push({ specifier: match[1], statement: match[0] });
    }
  }

  return imports;
}

function isAllowed(violation) {
  return temporaryAllowlist.some(
    (entry) =>
      entry.file === violation.file &&
      entry.specifier === violation.specifier &&
      entry.rule === violation.rule,
  );
}

function isRelative(specifier) {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

function resolvesTo(path, specifier) {
  if (!isRelative(specifier)) {
    return null;
  }

  return normalizePath(relative(rootDirectory, resolve(rootDirectory, dirname(path), specifier)));
}

function isReusablePackageSourcePath(path) {
  return /^packages\/(?:platform-core|nestjs-core|openapi-client-core|mock-core)\/src\//.test(path);
}

function isAppSourceImport(specifier, resolvedPath) {
  return (
    specifier.startsWith('apps/') ||
    specifier.startsWith('@client-portal/api/') ||
    specifier.startsWith('@client-portal/mock-api/') ||
    Boolean(resolvedPath?.startsWith('apps/'))
  );
}

function createViolation(file, specifier, rule, detail) {
  return { file, specifier, rule, detail };
}

function checkReusablePackage(file, specifier, resolvedPath) {
  const violations = [];
  const packageName = file.split('/')[1];
  const isCorePackage = isReusablePackageSourcePath(file);

  if (file.startsWith('packages/') && isAppSourceImport(specifier, resolvedPath)) {
    violations.push(
      createViolation(
        file,
        specifier,
        'package-app-import',
        'Reusable packages cannot import app source.',
      ),
    );
  }

  if (
    /^@client-portal\/(?:platform-core|nestjs-core|openapi-client-core|mock-core|eslint-config|tsconfig)\/(?:src|dist)(?:\/|$)/.test(
      specifier,
    ) ||
    (resolvedPath &&
      resolvedPath.startsWith('packages/') &&
      /\/(?:src|dist)\//.test(resolvedPath) &&
      !resolvedPath.startsWith(`packages/${packageName}/`))
  ) {
    violations.push(
      createViolation(
        file,
        specifier,
        'reusable-deep-import',
        'Use a declared reusable package export instead of src/dist.',
      ),
    );
  }

  if (!isCorePackage) {
    return violations;
  }

  const sharedForbidden =
    specifier === '@prisma/client' ||
    specifier.startsWith('@prisma/') ||
    specifier === 'prisma' ||
    specifier.startsWith('prisma/') ||
    specifier.startsWith('@client-portal/api-client');

  if (packageName === 'platform-core') {
    if (
      sharedForbidden ||
      specifier.startsWith('@nestjs/') ||
      specifier === 'fastify' ||
      specifier.startsWith('fastify/') ||
      specifier === 'vue' ||
      specifier.startsWith('vue/') ||
      specifier === 'nuxt' ||
      specifier.startsWith('nuxt/')
    ) {
      violations.push(
        createViolation(
          file,
          specifier,
          'platform-core-purity',
          'platform-core must stay independent of apps, Prisma, Nest, Fastify, Vue and Nuxt.',
        ),
      );
    }
  } else if (sharedForbidden || /(?:^|\/)domain(?:\/|$)/.test(specifier)) {
    violations.push(
      createViolation(
        file,
        specifier,
        'reusable-core-purity',
        'Reusable core packages cannot import app/domain/Prisma/generated project contracts.',
      ),
    );
  }

  return violations;
}

function checkWeb(file, specifier, resolvedPath) {
  if (!file.startsWith('apps/web/')) {
    return [];
  }

  if (
    specifier.startsWith('@nestjs/') ||
    specifier === '@prisma/client' ||
    specifier.startsWith('@prisma/') ||
    specifier === 'prisma' ||
    specifier.startsWith('prisma/') ||
    specifier.startsWith('apps/api/') ||
    specifier.startsWith('apps/mock-api/') ||
    specifier.startsWith('@client-portal/api/') ||
    specifier.startsWith('@client-portal/mock-api/') ||
    Boolean(resolvedPath?.startsWith('apps/api/') || resolvedPath?.startsWith('apps/mock-api/'))
  ) {
    return [
      createViolation(
        file,
        specifier,
        'web-backend-import',
        'The storefront cannot import backend DTOs, Prisma, Nest or app source.',
      ),
    ];
  }

  return [];
}

function checkApiMockSeparation(file, specifier, resolvedPath) {
  const refersToApi =
    specifier.startsWith('@client-portal/api') ||
    specifier.startsWith('apps/api/') ||
    Boolean(resolvedPath?.startsWith('apps/api/'));
  const refersToMock =
    specifier.startsWith('@client-portal/mock-api') ||
    specifier.startsWith('apps/mock-api/') ||
    Boolean(resolvedPath?.startsWith('apps/mock-api/'));

  if (file.startsWith('apps/api/') && refersToMock) {
    return [
      createViolation(
        file,
        specifier,
        'api-mock-separation',
        'apps/api and apps/mock-api communicate only through HTTP.',
      ),
    ];
  }
  if (file.startsWith('apps/mock-api/') && refersToApi) {
    return [
      createViolation(
        file,
        specifier,
        'api-mock-separation',
        'apps/api and apps/mock-api communicate only through HTTP.',
      ),
    ];
  }

  return [];
}

function isGeneratedPrismaImport(specifier, resolvedPath) {
  return (
    specifier === '@prisma/client' ||
    specifier.startsWith('@prisma/') ||
    specifier === 'prisma' ||
    specifier.startsWith('prisma/') ||
    specifier.includes('/generated/prisma') ||
    Boolean(resolvedPath?.includes('/generated/prisma'))
  );
}

function importsNestHttpException(specifier, statement) {
  return (
    specifier.startsWith('@nestjs/') && /\b(?:HttpException|[A-Za-z]+Exception)\b/.test(statement)
  );
}

function checkApiApplication(file, specifier, statement, resolvedPath) {
  if (!/^apps\/api\/src\/[^/]+\/application\//.test(file)) {
    return [];
  }

  if (
    /(?:^|\/)infrastructure(?:\/|$)/.test(specifier) ||
    isGeneratedPrismaImport(specifier, resolvedPath) ||
    importsNestHttpException(specifier, statement)
  ) {
    return [
      createViolation(
        file,
        specifier,
        'api-application-layer',
        'API application code cannot import infrastructure, generated Prisma or Nest HTTP exceptions.',
      ),
    ];
  }

  return [];
}

function checkAccessControl(file, specifier, resolvedPath) {
  if (!file.startsWith('apps/api/src/access-control/')) {
    return [];
  }

  if (
    /(?:^|\/)identity\/infrastructure(?:\/|$)/.test(specifier) ||
    /prisma-identity\.repository/.test(specifier) ||
    isGeneratedPrismaImport(specifier, resolvedPath)
  ) {
    return [
      createViolation(
        file,
        specifier,
        'access-control-identity',
        'Access-control orchestration cannot import concrete identity infrastructure or generated Prisma.',
      ),
    ];
  }

  return [];
}

function apiContext(path) {
  const match = /^apps\/api\/src\/([^/]+)\//.exec(path);
  return match?.[1] ?? null;
}

function checkApiDomain(file, specifier, statement, resolvedPath) {
  if (!/^apps\/api\/src\/[^/]+\/domain\//.test(file)) {
    return [];
  }

  const sourceContext = apiContext(file);
  const targetContext = resolvedPath ? apiContext(resolvedPath) : null;
  if (
    specifier.startsWith('@nestjs/') ||
    isGeneratedPrismaImport(specifier, resolvedPath) ||
    /(?:^|\/)(?:dto|infrastructure|http)(?:\/|$)/.test(specifier) ||
    importsNestHttpException(specifier, statement) ||
    (targetContext && targetContext !== sourceContext && /\/domain\//.test(resolvedPath))
  ) {
    return [
      createViolation(
        file,
        specifier,
        'api-domain-layer',
        'API domain code cannot import Nest, Prisma, HTTP DTOs, infrastructure or another context domain.',
      ),
    ];
  }

  return [];
}

function checkApiCrossContext(file, specifier, resolvedPath) {
  if (!file.startsWith('apps/api/src/')) {
    return [];
  }

  const sourceContext = apiContext(file);
  const targetContext = resolvedPath ? apiContext(resolvedPath) : null;
  const importsContextInternalLayer =
    Boolean(resolvedPath) &&
    /\/(?:application|domain|infrastructure|dto|http)\//.test(resolvedPath);
  if (
    sourceContext &&
    targetContext &&
    sourceContext !== targetContext &&
    importsContextInternalLayer &&
    !resolvedPath.endsWith('/public.js') &&
    !resolvedPath.endsWith('/public.ts')
  ) {
    return [
      createViolation(
        file,
        specifier,
        'api-cross-context-import',
        'Cross-context imports must use the owner public entrypoint.',
      ),
    ];
  }

  return [];
}

function checkLegacyMockExports(file, specifier) {
  if (!file.startsWith('apps/') && !file.startsWith('packages/')) {
    return [];
  }
  if (
    specifier === '@client-portal/platform-core/idempotency' ||
    specifier === '@client-portal/platform-core/scenario-registry'
  ) {
    return [
      createViolation(
        file,
        specifier,
        'legacy-mock-core-export',
        'Mock-only stores belong to @client-portal/mock-core, not platform-core.',
      ),
    ];
  }
  return [];
}

function checkMockCoreConsumers(file, specifier) {
  if (!specifier.startsWith('@client-portal/mock-core')) {
    return [];
  }
  if (
    file.startsWith('apps/mock-api/') ||
    file.startsWith('packages/mock-core/') ||
    (!file.startsWith('apps/') && !file.startsWith('packages/'))
  ) {
    return [];
  }
  return [
    createViolation(
      file,
      specifier,
      'mock-core-consumer',
      'Only apps/mock-api may consume mock-core.',
    ),
  ];
}

export function collectViolations(files) {
  const violations = [];

  for (const { path, source } of files) {
    const file = normalizePath(path);
    if (!isTrackedSource(file)) {
      continue;
    }

    for (const { specifier, statement } of extractImports(source)) {
      const resolvedPath = resolvesTo(file, specifier);
      const candidates = [
        ...checkReusablePackage(file, specifier, resolvedPath),
        ...checkWeb(file, specifier, resolvedPath),
        ...checkApiMockSeparation(file, specifier, resolvedPath),
        ...checkApiApplication(file, specifier, statement, resolvedPath),
        ...checkAccessControl(file, specifier, resolvedPath),
        ...checkApiDomain(file, specifier, statement, resolvedPath),
        ...checkApiCrossContext(file, specifier, resolvedPath),
        ...checkLegacyMockExports(file, specifier),
        ...checkMockCoreConsumers(file, specifier),
      ];

      violations.push(...candidates.filter((violation) => !isAllowed(violation)));
    }
  }

  return violations.sort((left, right) =>
    `${left.file}:${left.specifier}:${left.rule}`.localeCompare(
      `${right.file}:${right.specifier}:${right.rule}`,
    ),
  );
}

export function readTrackedSourceFiles(directory = rootDirectory) {
  const trackedFiles = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      cwd: directory,
      encoding: 'utf8',
    },
  )
    .split('\0')
    .filter(isTrackedSource)
    .sort();

  return trackedFiles.flatMap((path) => {
    const absolutePath = resolve(directory, path);
    if (!existsSync(absolutePath)) {
      return [];
    }

    return [{ path, source: readFileSync(absolutePath, 'utf8') }];
  });
}

export function formatViolations(violations) {
  return violations
    .map(({ file, specifier, rule, detail }) => `${file}: ${rule}: ${detail} (${specifier})`)
    .join('\n');
}

export { temporaryAllowlist };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const violations = collectViolations(readTrackedSourceFiles());
  if (violations.length > 0) {
    console.error(formatViolations(violations));
    process.exitCode = 1;
  }
}
