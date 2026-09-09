import { serializeHttpRequest } from '@client-portal/platform-core/http';
import { type DynamicModule, Module, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

interface LoggingEnvironment {
  readonly LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  readonly NODE_ENV: 'development' | 'test' | 'production';
}

export interface PlatformLoggingOptions {
  readonly additionalRedactPaths?: readonly string[];
}

export const BASE_LOG_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers.x-api-key',
  'res.headers.set-cookie',
  '*.password',
  '*.token',
  '*.secret',
  '*.apiKey',
] as const;

// nestjs-pino 4.x defaults to the legacy unnamed `*` middleware route. NestJS 11
// supports a named wildcard directly and does not need its legacy route converter.
const ALL_APPLICATION_ROUTES = [{ method: RequestMethod.ALL, path: '*path' }];

export { serializeHttpRequest };

@Module({})
export class PlatformLoggingModule {
  static forRoot(options: PlatformLoggingOptions = {}): DynamicModule {
    const redactPaths = [
      ...new Set([...BASE_LOG_REDACT_PATHS, ...(options.additionalRedactPaths ?? [])]),
    ];

    return {
      exports: [LoggerModule],
      imports: [
        LoggerModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService<LoggingEnvironment, true>) => {
            const usesPrettyTransport = config.get('NODE_ENV', { infer: true }) === 'development';

            return {
              forRoutes: ALL_APPLICATION_ROUTES,
              pinoHttp: {
                level: config.get('LOG_LEVEL', { infer: true }),
                redact: {
                  paths: redactPaths,
                  censor: '***REDACTED***',
                },
                serializers: { req: serializeHttpRequest },
                ...(usesPrettyTransport
                  ? {
                      transport: {
                        target: 'pino-pretty',
                        options: { colorize: true, singleLine: true },
                      },
                    }
                  : {}),
              },
            };
          },
        }),
      ],
      module: PlatformLoggingModule,
    };
  }
}
