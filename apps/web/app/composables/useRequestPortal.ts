import { createError, useAsyncData, useNuxtApp, useRoute } from 'nuxt/app';
import { computed, getCurrentScope } from 'vue';

import {
  asyncDataProblemPayload,
  statusCodeFromAsyncDataError,
  statusCodeFromThrown,
  traceIdFromAsyncDataError,
} from '~/utils/async-data-problem';
import { bindLiveCabinetPoll } from '~/utils/bind-live-cabinet-poll';
import {
  LIVE_CABINET_POLL_INTERVAL_MS,
  shouldApplyLiveCabinetPollResult,
  shouldPollLiveCabinet,
} from '~/utils/live-cabinet-poll';
import { requestPortalCacheKey } from '~/utils/request-portal-cache-key';
import { routeParamValue } from '~/utils/route-param-value';

export async function useRequestPortal() {
  const { $api } = useNuxtApp();
  const route = useRoute();
  const accessSecret = computed(() => routeParamValue(route.params.accessSecret));
  const liveCabinetScope = import.meta.client ? getCurrentScope() : undefined;

  const { data, error, status } = await useAsyncData(
    () => requestPortalCacheKey(accessSecret.value),
    async () => {
      const secret = accessSecret.value;
      try {
        const response = await $api.GET('/requests/{accessSecret}', {
          params: { path: { accessSecret: secret } },
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
    },
    {
      watch: [() => route.params.accessSecret],
    },
  );

  const request = computed(() => data.value);
  const errorTraceId = computed(() => traceIdFromAsyncDataError(error.value));
  const isNotFound = computed(() => statusCodeFromAsyncDataError(error.value, 0) === 404);

  if (import.meta.client && liveCabinetScope) {
    liveCabinetScope.run(() => {
      bindLiveCabinetPoll<NonNullable<typeof data.value>>({
        applyPortal: (secret, portal) => {
          if (!shouldApplyLiveCabinetPollResult(secret, accessSecret.value)) {
            return;
          }

          data.value = portal;
        },
        fetchPortal: async (secret) => {
          try {
            const response = await $api.GET('/requests/{accessSecret}', {
              params: { path: { accessSecret: secret } },
            });
            return response.data?.data;
          } catch (caught) {
            if (data.value != null) {
              return undefined;
            }

            throw caught;
          }
        },
        getAccessSecret: () => accessSecret.value,
        getDemoLive: () => (shouldPollLiveCabinet(data.value) ? true : undefined),
        getReady: () => status.value === 'success',
        intervalMs: LIVE_CABINET_POLL_INTERVAL_MS,
      });
    });
  }

  return {
    accessSecret,
    error,
    errorTraceId,
    isNotFound,
    request,
    status,
  };
}
