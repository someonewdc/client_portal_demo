import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { collectViolations, formatViolations, temporaryAllowlist } from './check-boundaries.mjs';

function violationsFor(path, source) {
  return collectViolations([{ path, source }]);
}

describe('architecture boundary checker', () => {
  const cases = [
    {
      name: 'allows a reusable package to use its own source and platform export',
      path: 'packages/nestjs-core/src/logging.ts',
      allowed: "import { serializeHttpRequest } from '@client-portal/platform-core/http';",
      forbidden:
        "import { createApplication } from '../../../apps/api/src/bootstrap/create-application.js';",
      rule: 'package-app-import',
    },
    {
      name: 'protects platform-core purity',
      path: 'packages/platform-core/src/example.ts',
      allowed: "import { z } from 'zod';",
      forbidden: "import { Injectable } from '@nestjs/common';",
      rule: 'platform-core-purity',
    },
    {
      name: 'protects reusable core package purity',
      path: 'packages/openapi-client-core/src/example.ts',
      allowed:
        "import { normalizeCorrelationId } from '@client-portal/platform-core/correlation-id';",
      forbidden: "import type { paths } from '@client-portal/api-client';",
      rule: 'reusable-core-purity',
    },
    {
      name: 'protects mock-core purity and allows platform-core json',
      path: 'packages/mock-core/src/example.ts',
      allowed: "import { isRecord } from '@client-portal/platform-core/json';",
      forbidden: "import type { paths } from '@client-portal/api-client';",
      rule: 'reusable-core-purity',
    },
    {
      name: 'allows mock-api to import mock-core and rejects retired platform-core mock exports',
      path: 'apps/mock-api/src/example.ts',
      allowed: "import { InMemoryIdempotencyStore } from '@client-portal/mock-core/idempotency';",
      forbidden:
        "import { InMemoryIdempotencyStore } from '@client-portal/platform-core/idempotency';",
      rule: 'legacy-mock-core-export',
    },
    {
      name: 'keeps mock-core limited to mock-api',
      path: 'apps/api/src/example.ts',
      allowed:
        "import { normalizeCorrelationId } from '@client-portal/platform-core/correlation-id';",
      forbidden: "import { InMemoryIdempotencyStore } from '@client-portal/mock-core/idempotency';",
      rule: 'mock-core-consumer',
    },
    {
      name: 'rejects reusable src and dist deep imports',
      path: 'apps/web/app/example.ts',
      allowed: "import { createProblemAwareClient } from '@client-portal/openapi-client-core';",
      forbidden: [
        "import { createProblemAwareClient } from '@client-portal/openapi-client-core/",
        "src/index.js';",
      ].join(''),
      rule: 'reusable-deep-import',
    },
    {
      name: 'keeps the storefront away from backend source',
      path: 'apps/web/app/example.ts',
      allowed: "import { createApiClient } from '@client-portal/api-client';",
      forbidden: "import { PrismaClient } from '@prisma/client';",
      rule: 'web-backend-import',
    },
    {
      name: 'keeps API and mock API source separate',
      path: 'apps/api/src/integrations/example.ts',
      allowed: "import { z } from 'zod';",
      forbidden: "import { mockFixture } from '../../../mock-api/src/fixtures/mock.js';",
      rule: 'api-mock-separation',
    },
    {
      name: 'keeps infrastructure and HTTP exceptions out of application',
      path: 'apps/api/src/catalog/application/example.ts',
      allowed: "import { CATALOG_REPOSITORY } from '../domain/catalog.js';",
      forbidden: "import { BadRequestException } from '@nestjs/common';",
      rule: 'api-application-layer',
    },
    {
      name: 'keeps concrete Prisma adapters out of application',
      path: 'apps/api/src/catalog/application/example.ts',
      allowed: "import { CATALOG_REPOSITORY } from '../domain/catalog.js';",
      forbidden:
        "import { PrismaCatalogRepository } from '../infrastructure/prisma-catalog.repository.js';",
      rule: 'api-application-layer',
    },
    {
      name: 'keeps concrete identity adapters out of access control',
      path: 'apps/api/src/access-control/example.ts',
      allowed: "import type { AuthenticatedActor } from '../identity/public.js';",
      forbidden:
        "import { PrismaIdentityRepository } from '../identity/infrastructure/prisma-identity.repository.js';",
      rule: 'access-control-identity',
    },
    {
      name: 'keeps API domain independent of framework and foreign contexts',
      path: 'apps/api/src/pricing/domain/example.ts',
      allowed: "import type { PriceMode } from './pricing.js';",
      forbidden: "import type { AuthenticatedActor } from '../../identity/domain/identity.js';",
      rule: 'api-domain-layer',
    },
    {
      name: 'allows domain to use app-local shared vocabulary without another context domain',
      path: 'apps/api/src/integrations/domain/example.ts',
      allowed: "import type { IntegrationStatus } from '../../shared/integration-status.js';",
      forbidden: "import type { QuoteRequestStatus } from '../../quotes/domain/quote-request.js';",
      rule: 'api-domain-layer',
    },
    {
      name: 'requires public entrypoints for cross-context imports',
      path: 'apps/api/src/orders/application/example.ts',
      allowed: "import type { AuthenticatedActor } from '../../identity/public.js';",
      forbidden: "import type { AuthenticatedActor } from '../../identity/domain/identity.js';",
      rule: 'api-cross-context-import',
    },
    {
      name: 'treats http DTOs as a context-internal layer',
      path: 'apps/api/src/openapi/document.ts',
      allowed: "import { RequestsModule } from '../requests/public.js';",
      forbidden: "import { DemoLinkItemDto } from '../requests/http/request.dto.js';",
      rule: 'api-cross-context-import',
    },
  ];

  for (const testCase of cases) {
    it(testCase.name, () => {
      assert.deepEqual(violationsFor(testCase.path, testCase.allowed), []);
      assert.deepEqual(
        violationsFor(testCase.path, testCase.forbidden)
          .map((violation) => violation.rule)
          .includes(testCase.rule),
        true,
      );
    });
  }

  it('ignores generated and commented code', () => {
    assert.deepEqual(
      violationsFor(
        'apps/api/src/generated/prisma/internal/class.ts',
        "import { PrismaClient } from '@prisma/client';",
      ),
      [],
    );
    assert.deepEqual(
      violationsFor(
        'apps/web/app/example.ts',
        "// import { PrismaClient } from '@prisma/client';\n/* import { NestFactory } from '@nestjs/core'; */",
      ),
      [],
    );
  });

  it('checks static exports, dynamic imports and Vue script blocks', () => {
    assert.deepEqual(
      violationsFor(
        'apps/web/app/example.ts',
        "export { PrismaClient } from '@prisma/client';",
      ).map((violation) => violation.rule),
      ['web-backend-import'],
    );
    assert.deepEqual(
      violationsFor(
        'apps/web/app/example.ts',
        "const prisma = await import('@prisma/client');",
      ).map((violation) => violation.rule),
      ['web-backend-import'],
    );
    assert.deepEqual(
      violationsFor(
        'apps/web/app/components/example.vue',
        '<script setup lang="ts">\nimport { PrismaClient } from \'@prisma/client\';\n</script>',
      ).map((violation) => violation.rule),
      ['web-backend-import'],
    );
  });

  it('has no legacy boundary allowlist after FH-4', () => {
    assert.deepEqual(temporaryAllowlist, []);
  });

  it('formats actionable deterministic errors', () => {
    assert.equal(
      formatViolations([
        {
          file: 'apps/web/app/example.ts',
          specifier: '@prisma/client',
          rule: 'web-backend-import',
          detail: 'The storefront cannot import backend DTOs, Prisma, Nest or app source.',
        },
      ]),
      'apps/web/app/example.ts: web-backend-import: The storefront cannot import backend DTOs, Prisma, Nest or app source. (@prisma/client)',
    );
  });
});
