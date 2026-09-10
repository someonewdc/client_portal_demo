import { createError, useAsyncData, useNuxtApp, useRoute } from 'nuxt/app';
import { computed } from 'vue';

import {
  asyncDataProblemPayload,
  statusCodeFromAsyncDataError,
  statusCodeFromThrown,
  traceIdFromAsyncDataError,
} from '~/utils/async-data-problem';

export function routeParamValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function useRequestPortal() {
  const { $api } = useNuxtApp();
  const route = useRoute();
  const accessSecret = routeParamValue(route.params.accessSecret);

  const { data, error, status } = await useAsyncData(`request-portal:${accessSecret}`, async () => {
    try {
      const response = await $api.GET('/requests/{accessSecret}', {
        params: { path: { accessSecret } },
      });
      const portal = response.data?.data;
      if (!portal) {
        throw new Error('Request portal response is missing data');
      }
      return portal;
    } catch (caught) {
      const payload = asyncDataProblemPayload(caught);
      throw createError({
        cause: caught,
        message: 'Не удалось загрузить заявку.',
        statusCode: statusCodeFromThrown(caught),
        ...(payload === undefined ? {} : { data: payload }),
      });
    }
  });

  const request = computed(() => data.value);
  const errorTraceId = computed(() => traceIdFromAsyncDataError(error.value));
  const isNotFound = computed(() => statusCodeFromAsyncDataError(error.value, 0) === 404);

  return {
    accessSecret,
    error,
    errorTraceId,
    isNotFound,
    request,
    status,
  };
}
