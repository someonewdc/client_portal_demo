import { readFileSync } from 'node:fs';
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

function schemaPropertyType(
  document: Record<string, unknown>,
  schemaName: string,
  property: string,
): unknown {
  const components = asRecord(document.components);
  const schemas = asRecord(components.schemas);
  const schema = asRecord(schemas[schemaName]);
  const properties = asRecord(schema.properties);

  return asRecord(properties[property]).type;
}

function responseContentTypes(
  document: Record<string, unknown>,
  path: string,
  status: string,
): string[] {
  const paths = asRecord(document.paths);
  const item = asRecord(paths[path]);
  const get = asRecord(item.get);
  const responses = asRecord(get.responses);
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
    expect(responseContentTypes(document, '/requests/{accessSecret}', '404')).toEqual([
      'application/problem+json',
    ]);
  });

  it('declares spec quantity and file byteSize as integers', () => {
    expect(schemaPropertyType(document, 'RequestSpecLineDto', 'quantity')).toBe('integer');
    expect(schemaPropertyType(document, 'RequestFileDto', 'byteSize')).toBe('integer');
  });
});
