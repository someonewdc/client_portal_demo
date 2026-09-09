import { createApiClient, type ApiClient } from '@client-portal/api-client';
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;
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
