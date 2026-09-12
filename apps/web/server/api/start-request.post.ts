import { createApiClient } from '@client-portal/api-client';
import { createError, defineEventHandler, sendRedirect } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';

const LIVE_PORTAL_PATH = '/r/seed-z10046-live-severnaya-duga';

function serverApiBaseUrl(config: ReturnType<typeof useRuntimeConfig>): string {
  const serverBaseUrl = config.apiBaseUrl;
  if (typeof serverBaseUrl === 'string' && serverBaseUrl.length > 0) {
    return serverBaseUrl;
  }

  const publicBaseUrl = config.public.apiBaseUrl;
  if (typeof publicBaseUrl === 'string' && publicBaseUrl.length > 0) {
    return publicBaseUrl;
  }

  throw createError({
    message: 'Не удалось отправить заявку.',
    statusCode: 500,
  });
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const secret = config.demoConductorSecret;
  if (typeof secret !== 'string' || secret.length === 0) {
    throw createError({
      message: 'Не удалось отправить заявку.',
      statusCode: 500,
    });
  }

  const api = createApiClient(serverApiBaseUrl(config));
  try {
    await api.POST('/demo/conductor/{conductorSecret}/reset', {
      params: {
        path: {
          conductorSecret: secret,
        },
      },
    });
  } catch {
    throw createError({
      message: 'Не удалось отправить заявку.',
      statusCode: 502,
    });
  }

  return sendRedirect(event, LIVE_PORTAL_PATH, 303);
});
