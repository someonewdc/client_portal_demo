import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { Observable } from 'rxjs';

export const CAPABILITY_JSON_CACHE_CONTROL = 'private, no-store';

@Injectable()
export class CapabilityCacheControlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    void reply.header('Cache-Control', CAPABILITY_JSON_CACHE_CONTROL);
    return next.handle();
  }
}
