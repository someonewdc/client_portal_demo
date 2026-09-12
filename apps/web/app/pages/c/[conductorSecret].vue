<script setup lang="ts">
import {
  createError,
  setResponseStatus,
  useAsyncData,
  useNuxtApp,
  useRoute,
  useSeoMeta,
} from 'nuxt/app';
import { computed } from 'vue';

import {
  asyncDataProblemPayload,
  documentStatusFromAsyncData,
  statusCodeFromAsyncDataError,
  statusCodeFromThrown,
  traceIdFromAsyncDataError,
} from '~/utils/async-data-problem';
import { routeParamValue } from '~/utils/route-param-value';

const { $api } = useNuxtApp();
const route = useRoute();
const conductorSecret = computed(() => routeParamValue(route.params.conductorSecret));
const advanceAction = computed(
  () => `/api/conductor/${encodeURIComponent(conductorSecret.value)}/advance`,
);
const resetAction = computed(
  () => `/api/conductor/${encodeURIComponent(conductorSecret.value)}/reset`,
);

const { error, status } = await useAsyncData(
  () => `conductor:${conductorSecret.value}`,
  async () => {
    const secret = conductorSecret.value;
    try {
      const response = await $api.GET('/demo/conductor/{conductorSecret}', {
        params: { path: { conductorSecret: secret } },
      });
      const snapshot = response.data?.data;
      if (!snapshot) {
        throw new Error('Conductor snapshot response is missing data');
      }
      return snapshot;
    } catch (caught) {
      const payload = asyncDataProblemPayload(caught);
      throw createError({
        cause: caught,
        message: 'Не удалось загрузить пульт.',
        statusCode: statusCodeFromThrown(caught),
        ...(payload === undefined ? {} : { data: payload }),
      });
    }
  },
  {
    watch: [() => route.params.conductorSecret],
  },
);

const isNotFound = computed(() => statusCodeFromAsyncDataError(error.value, 0) === 404);
const errorTraceId = computed(() => traceIdFromAsyncDataError(error.value));
const documentStatus = documentStatusFromAsyncData(error.value);
if (documentStatus !== 200) {
  setResponseStatus(documentStatus);
}

useSeoMeta({
  title: computed(() => {
    if (isNotFound.value) {
      return 'Ссылка недействительна — ПК «Нордщит»';
    }

    if (error.value) {
      return 'ПК «Нордщит»';
    }

    return 'Пульт показа — ПК «Нордщит»';
  }),
});
</script>

<template>
  <main>
    <p v-if="status === 'pending'" class="text-ink-muted" role="status">Загрузка пульта…</p>
    <section v-else-if="isNotFound" role="alert">
      <h1 class="document-display">Ссылка недействительна</h1>
      <p class="mt-3 text-ink-muted">
        Заявки по этой ссылке нет. Проверьте адрес или попросите новую ссылку у менеджера.
      </p>
    </section>
    <p v-else-if="error" class="text-ink" role="alert">
      Не удалось загрузить пульт.
      <span v-if="errorTraceId" class="mt-2 block tabular-nums text-ink-muted">
        Код ошибки: {{ errorTraceId }}
      </span>
    </p>
    <template v-else>
      <h1 class="document-display">Пульт показа</h1>
      <p class="mt-3 text-ink">Этот экран не показывается заказчику.</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <form method="post" :action="advanceAction">
          <button class="live-control" type="submit">Продвинуть заявку</button>
        </form>
        <form method="post" :action="resetAction">
          <button class="live-control" type="submit">Сбросить</button>
        </form>
      </div>
    </template>
  </main>
</template>
