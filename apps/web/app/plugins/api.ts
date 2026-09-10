import { createApiClient, type ApiClient } from '@client-portal/api-client';
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const publicBaseUrl = config.public.apiBaseUrl;
  let baseUrl = publicBaseUrl;
  if (import.meta.server) {
    const serverBaseUrl = config.apiBaseUrl;
    if (typeof serverBaseUrl === 'string' && serverBaseUrl.length > 0) {
      baseUrl = serverBaseUrl;
    }
  }
  if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
    throw new TypeError('runtimeConfig.public.apiBaseUrl must be the API origin with /api/v1');
  }

  const api = createApiClient(baseUrl);
  return {
    provide: {
      api,
    },
  };
});

declare module '#app' {
  interface NuxtApp {
    $api: ApiClient;
  }
}
