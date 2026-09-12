import { constantTimeTextEqual } from '@client-portal/platform-core/opaque-token';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApiEnv } from '../../core/config/api-env.js';
import type { ConductorAuthPort } from '../application/conductor-auth.port.js';

@Injectable()
export class EnvConductorAuth implements ConductorAuthPort {
  private readonly expectedSecret: string;

  constructor(@Inject(ConfigService) config: ConfigService<ApiEnv, true>) {
    this.expectedSecret = config.get('DEMO_CONDUCTOR_SECRET', { infer: true });
  }

  matches(conductorSecret: string): boolean {
    return constantTimeTextEqual(conductorSecret, this.expectedSecret);
  }
}
