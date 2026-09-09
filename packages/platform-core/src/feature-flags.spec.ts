import { describe, expect, it } from 'vitest';

import {
  FeatureFlagConfigurationError,
  resolveFeatureFlags,
  type FeatureProfileMatrix,
} from './feature-flags.js';

type TestFeature = 'alpha' | 'beta';
type TestProfile = 'basic' | 'expanded';

const profiles: FeatureProfileMatrix<TestProfile, TestFeature> = {
  basic: { alpha: true, beta: false },
  expanded: { alpha: true, beta: true },
};

describe('resolveFeatureFlags', () => {
  it('uses the selected profile and gives explicit overrides precedence', () => {
    const resolved = resolveFeatureFlags({
      overrides: { beta: true },
      profile: 'basic',
      profiles,
    });

    expect(resolved).toEqual({
      features: { alpha: true, beta: true },
      profile: 'basic',
    });
    expect(Object.isFrozen(resolved.features)).toBe(true);
  });

  it('runs dependency validators after overrides are resolved', () => {
    expect(() =>
      resolveFeatureFlags({
        overrides: { alpha: false },
        profile: 'expanded',
        profiles,
        validators: [
          (features) =>
            features.beta && !features.alpha ? 'beta requires alpha to be enabled' : undefined,
        ],
      }),
    ).toThrow('beta requires alpha to be enabled');
  });

  it('rejects an override for an unknown feature', () => {
    expect(() =>
      resolveFeatureFlags({
        overrides: { gamma: true } as never,
        profile: 'basic',
        profiles,
      }),
    ).toThrow(FeatureFlagConfigurationError);
  });
});
