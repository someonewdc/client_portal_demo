import { ApiProblemError, createApiClient } from '@client-portal/api-client';
import { createError, defineEventHandler, getRouterParam, sendRedirect } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';

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
    message: 'Не удалось сменить шаг.',
    statusCode: 500,
  });
}

function conductorPath(secret: string): string {
  return `/c/${encodeURIComponent(secret)}`;
}

export default defineEventHandler(async (event) => {
  const conductorSecret = getRouterParam(event, 'conductorSecret') ?? '';
  const action = getRouterParam(event, 'action') ?? '';
  if (conductorSecret.length === 0 || (action !== 'advance' && action !== 'reset')) {
    throw createError({
      message: 'Не удалось сменить шаг.',
      statusCode: 404,
    });
  }

  const path =
    action === 'advance'
      ? '/demo/conductor/{conductorSecret}/advance'
      : '/demo/conductor/{conductorSecret}/reset';
  const api = createApiClient(serverApiBaseUrl(useRuntimeConfig(event)));
  try {
    await api.POST(path, {
      params: {
        path: {
          conductorSecret,
        },
      },
    });
  } catch (caught) {
    if (caught instanceof ApiProblemError && caught.status === 409) {
      return sendRedirect(event, conductorPath(conductorSecret), 303);
    }

    const status = caught instanceof ApiProblemError ? caught.status : 502;
    throw createError({
      message: 'Не удалось сменить шаг.',
      statusCode: status === 404 ? 404 : 502,
    });
  }

  return sendRedirect(event, conductorPath(conductorSecret), 303);
});
