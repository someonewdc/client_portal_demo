import type { ThrottlerModuleOptions } from '@nestjs/throttler';

export const PORTAL_THROTTLE_TTL_MS = 60_000;
export const PORTAL_THROTTLE_LIMIT = 60;

export function clientIpTracker(req: { readonly ip?: unknown }): string {
  return typeof req.ip === 'string' && req.ip.length > 0 ? req.ip : 'unknown';
}

export function portalThrottleKey(
  _context: unknown,
  tracker: string,
  throttlerName: string,
): string {
  return `request-portal:${throttlerName}:${tracker}`;
}

export function portalThrottlerModuleOptions(
  limit: number = PORTAL_THROTTLE_LIMIT,
): ThrottlerModuleOptions {
  return {
    generateKey: portalThrottleKey,
    getTracker: clientIpTracker,
    throttlers: [{ limit, ttl: PORTAL_THROTTLE_TTL_MS }],
  };
}
