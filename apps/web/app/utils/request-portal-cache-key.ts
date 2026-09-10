export function requestPortalCacheKey(secret: string): string {
  return `request-portal:${secret}`;
}
