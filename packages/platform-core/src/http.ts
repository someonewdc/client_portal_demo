export const DEFAULT_MAX_JSON_RESPONSE_BYTES = 2_097_152;

export class JsonResponseTooLargeError extends Error {
  constructor() {
    super('JSON response exceeded the configured byte limit');
    this.name = JsonResponseTooLargeError.name;
  }
}

export function pathWithoutQuery(value: string): string {
  const queryStart = value.indexOf('?');
  return queryStart === -1 ? value : value.slice(0, queryStart);
}

export function serializeHttpRequest(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  const request = value as Record<string, unknown>;
  const url = typeof request.url === 'string' ? pathWithoutQuery(request.url) : undefined;

  return {
    ...(typeof request.id === 'string' ? { id: request.id } : {}),
    ...(typeof request.method === 'string' ? { method: request.method } : {}),
    ...(url ? { url } : {}),
  };
}

export async function readBoundedJsonResponse(
  response: Response,
  maxBytes = DEFAULT_MAX_JSON_RESPONSE_BYTES,
): Promise<unknown> {
  const contentLength = response.headers.get('content-length');
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw new JsonResponseTooLargeError();
  }
  if (!response.body) {
    return undefined;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let body = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    bytesRead += value.byteLength;
    if (bytesRead > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new JsonResponseTooLargeError();
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  if (body.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}
