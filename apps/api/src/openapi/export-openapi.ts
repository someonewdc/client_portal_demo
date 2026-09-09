import 'reflect-metadata';

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
    throw new Error(`OpenAPI servers[0].url must contain /api/v1, received ${serverUrl}`);
  }
  if (document.paths?.['/api/v1/demo/links'] !== undefined) {
    throw new Error('OpenAPI path keys must stay relative; found /api/v1/demo/links');
  }
  if (document.paths?.['/demo/links'] === undefined) {
    throw new Error('OpenAPI is missing path /demo/links');
  }
  if (document.paths?.['/requests/{accessSecret}'] === undefined) {
    throw new Error('OpenAPI is missing path /requests/{accessSecret}');
  }
}

const app = await createApplication();
try {
  const document = buildOpenApiDocument(app);
  assertContract(document);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`);
} finally {
  await app.close();
}
