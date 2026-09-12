<script setup lang="ts">
import { createError, setResponseStatus, useAsyncData, useNuxtApp, useSeoMeta } from 'nuxt/app';
import { computed } from 'vue';

import {
  asyncDataProblemPayload,
  documentStatusFromAsyncData,
  statusCodeFromThrown,
  traceIdFromAsyncDataError,
} from '~/utils/async-data-problem';

const { $api } = useNuxtApp();

useSeoMeta({
  title: 'Ссылки для показа — ПК «Нордщит»',
});

const { data, error, status } = await useAsyncData('demo-links', async () => {
  try {
    const response = await $api.GET('/demo/links');
    const items = response.data?.data.items;
    if (!items) {
      throw new Error('Demo links response is missing data.items');
    }
    return items;
  } catch (caught) {
    const payload = asyncDataProblemPayload(caught);
    throw createError({
      cause: caught,
      message: 'Не удалось загрузить список заявок.',
      statusCode: statusCodeFromThrown(caught),
      ...(payload === undefined ? {} : { data: payload }),
    });
  }
});

const items = computed(() => data.value ?? []);
const errorTraceId = computed(() => traceIdFromAsyncDataError(error.value));
const documentStatus = documentStatusFromAsyncData(error.value);
if (documentStatus !== 200) {
  setResponseStatus(documentStatus);
}

function formatUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(iso));
}
</script>

<template>
  <main>
    <h1 class="document-display">Ссылки для показа</h1>
    <p class="mt-3 text-ink">Этот список не показывается заказчику.</p>
    <p class="mt-2 text-ink-muted">Так выглядит то, что вы отправили бы заказчику в мессенджер.</p>
    <p class="mt-2 text-ink">Нажмите строку — откроется экран заказчика по ссылке.</p>

    <p v-if="status === 'pending'" class="mt-8 text-ink-muted" role="status">
      Загрузка списка заявок…
    </p>
    <p v-else-if="error" class="mt-8 text-ink" role="alert">
      Не удалось загрузить список заявок.
      <span v-if="errorTraceId" class="mt-2 block tabular-nums text-ink-muted">
        Код ошибки: {{ errorTraceId }}
      </span>
    </p>
    <p v-else-if="items.length === 0" class="mt-8 text-ink-muted">Заявок пока нет.</p>
    <ul v-else class="mt-8 divide-y divide-rule">
      <li v-for="item in items" :key="item.publicNumber">
        <NuxtLink class="block py-4 text-ink hover:text-accent" :to="item.portalPath">
          <span class="document-link font-semibold tabular-nums">
            {{ item.publicNumber }}
          </span>
          <span class="text-ink-muted"> · {{ item.counterpartyName }}</span>
          <span class="mt-1 block">
            <span class="document-link">{{ item.title }}</span>
          </span>
          <span class="mt-2 flex flex-wrap items-center gap-3">
            <span class="status-stamp text-sm">
              {{ item.statusLabel }}
            </span>
            <time class="text-sm tabular-nums text-ink-muted" :datetime="item.updatedAt">
              {{ formatUpdatedAt(item.updatedAt) }}
            </time>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>
