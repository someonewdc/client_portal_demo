import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  environmentBooleanSchema,
  environmentPortSchema,
  validateEnvironment,
} from './environment.js';

describe('environment primitives', () => {
  it('parses explicit boolean strings without truthy coercion', () => {
    expect(environmentBooleanSchema.parse('false')).toBe(false);
    expect(environmentBooleanSchema.parse('1')).toBe(true);
  });

  it('reports the owning application in validation failures', () => {
    const schema = z.object({ PORT: environmentPortSchema() });

    expect(() => validateEnvironment(schema, { PORT: '70000' }, 'worker')).toThrow(
      'Invalid worker environment',
    );
  });
});
