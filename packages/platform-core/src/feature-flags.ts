export type FeatureFlags<TFeature extends string> = Readonly<Record<TFeature, boolean>>;

export type FeatureProfileMatrix<TProfile extends string, TFeature extends string> = Readonly<
  Record<TProfile, FeatureFlags<TFeature>>
>;

export type FeatureOverrides<TFeature extends string> = Readonly<
  Partial<Record<TFeature, boolean | undefined>>
>;

export type FeatureDependencyValidator<TFeature extends string> = (
  features: FeatureFlags<TFeature>,
) => string | undefined;

export interface ResolveFeatureFlagsOptions<TProfile extends string, TFeature extends string> {
  readonly profile: TProfile;
  readonly profiles: FeatureProfileMatrix<TProfile, TFeature>;
  readonly overrides?: FeatureOverrides<TFeature>;
  readonly validators?: readonly FeatureDependencyValidator<TFeature>[];
}

export interface ResolvedFeatureFlags<TProfile extends string, TFeature extends string> {
  readonly profile: TProfile;
  readonly features: FeatureFlags<TFeature>;
}

export class FeatureFlagConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureFlagConfigurationError';
  }
}

export function resolveFeatureFlags<TProfile extends string, TFeature extends string>(
  options: ResolveFeatureFlagsOptions<TProfile, TFeature>,
): ResolvedFeatureFlags<TProfile, TFeature> {
  const baseline = options.profiles[options.profile];
  if (!baseline) {
    throw new FeatureFlagConfigurationError(`Unknown profile: ${options.profile}`);
  }

  const resolved = { ...baseline } as Record<TFeature, boolean>;
  for (const key of Object.keys(options.overrides ?? {})) {
    if (!Object.hasOwn(baseline, key)) {
      throw new FeatureFlagConfigurationError(`Unknown feature override: ${key}`);
    }

    const feature = key as TFeature;
    const override = options.overrides?.[feature];
    if (override !== undefined) {
      resolved[feature] = override;
    }
  }

  const features = Object.freeze(resolved) as FeatureFlags<TFeature>;
  for (const validate of options.validators ?? []) {
    const message = validate(features);
    if (message) {
      throw new FeatureFlagConfigurationError(message);
    }
  }

  return { features, profile: options.profile };
}
