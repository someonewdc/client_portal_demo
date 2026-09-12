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

  it('fixes portal stages to four items and specLines to 2–5', () => {
    expect(schemaProperty(document, 'RequestPortalDataDto', 'stages')).toMatchObject({
      maxItems: 4,
      minItems: 4,
      type: 'array',
    });
    expect(schemaProperty(document, 'RequestPortalDataDto', 'specLines')).toMatchObject({
      maxItems: 5,
      minItems: 2,
      type: 'array',
    });
  });

  it('documents conductor GET/POST snapshots and problem+json failures', () => {
    const paths = asRecord(document.paths);
    expect(Object.keys(paths)).toEqual(
      expect.arrayContaining([
        '/demo/conductor/{conductorSecret}',
        '/demo/conductor/{conductorSecret}/advance',
        '/demo/conductor/{conductorSecret}/reset',
      ]),
    );
    expect(responseContentTypes(document, '/demo/conductor/{conductorSecret}', '200')).toContain(
      'application/json',
    );
    expect(responseContentTypes(document, '/demo/conductor/{conductorSecret}', '404')).toEqual([
      'application/problem+json',
    ]);
    expect(
      responseContentTypes(document, '/demo/conductor/{conductorSecret}/advance', '200', 'post'),
    ).toContain('application/json');
    expect(
      responseContentTypes(document, '/demo/conductor/{conductorSecret}/advance', '409', 'post'),
    ).toEqual(['application/problem+json']);
    expect(
      responseContentTypes(document, '/demo/conductor/{conductorSecret}/reset', '200', 'post'),
    ).toContain('application/json');
    expect(schemaProperty(document, 'ConductorSnapshotDataDto', 'nextStatus')).toMatchObject({
      nullable: true,
    });
    expect(schemaProperty(document, 'ConductorSnapshotDataDto', 'nextStatusLabel')).toMatchObject({
      nullable: true,
    });
  });
});
