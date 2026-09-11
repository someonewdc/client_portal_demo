const loopbackTwinHost: Record<string, string> = {
  localhost: '127.0.0.1',
  '127.0.0.1': 'localhost',
};

export function corsOriginsFromWebOrigin(webOrigin: string): string[] {
  const origin = new URL(webOrigin);
  const twinHost = loopbackTwinHost[origin.hostname];
  if (twinHost === undefined) {
    return [webOrigin];
  }

  const twin = new URL(webOrigin);
  twin.hostname = twinHost;
  return [webOrigin, twin.origin];
}
