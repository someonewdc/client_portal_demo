import { PlatformLoggingModule } from '@client-portal/nestjs-core/logging';
import { provideProblemDetailsFilter } from '@client-portal/nestjs-core/problem-details';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

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
  providers: [provideProblemDetailsFilter({ typeBaseUrl: 'https://demo.local/problems' })],
})
export class AppModule {}
