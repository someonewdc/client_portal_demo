<script setup lang="ts">
import { createError, setResponseStatus, useAsyncData, useNuxtApp, useRoute } from 'nuxt/app';
import { computed } from 'vue';

import {
  asyncDataProblemPayload,
  statusCodeFromAsyncDataError,
  statusCodeFromThrown,
  traceIdFromAsyncDataError,
} from '~/utils/async-data-problem';

const { $api } = useNuxtApp();
const route = useRoute();
const accessSecretParam = route.params.accessSecret;
const accessSecret = Array.isArray(accessSecretParam)
  ? (accessSecretParam[0] ?? '')
  : (accessSecretParam ?? '');

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

if (isNotFound.value) {
  setResponseStatus(404);
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

function stampClass(stage: { reachedAt: string | null; status: string }, currentStatus: string) {
  if (stage.status === currentStatus) {
    return 'inline-block bg-accent/15 px-2 py-0.5 text-sm font-semibold text-accent';
  }

  if (stage.reachedAt !== null) {
    return 'inline-block px-2 py-0.5 text-sm text-ink';
  }

  return 'inline-block px-2 py-0.5 text-sm text-ink-muted';
}
</script>

<template>
  <main>
    <p v-if="status === 'pending'" class="text-ink-muted" role="status">Загрузка заявки…</p>
    <template v-else-if="isNotFound">
      <h2 class="text-xl font-semibold text-ink">Ссылка недействительна</h2>
      <p class="mt-3 text-ink-muted">
        Заявки по этой ссылке нет. Проверьте адрес или попросите новую ссылку у менеджера.
      </p>
      <p v-if="errorTraceId" class="mt-4 tabular-nums text-ink-muted">
        Код ошибки: {{ errorTraceId }}
      </p>
    </template>
    <p v-else-if="error" class="text-ink" role="alert">
      Не удалось загрузить заявку.
      <span v-if="errorTraceId" class="mt-2 block tabular-nums text-ink-muted">
        Код ошибки: {{ errorTraceId }}
      </span>
    </p>
    <template v-else-if="request">
      <p class="text-xl font-semibold tabular-nums text-ink">{{ request.publicNumber }}</p>
      <p class="mt-2 text-ink">{{ request.counterpartyName }}</p>
      <p class="mt-1 text-ink-muted">{{ request.title }}</p>
      <p class="mt-4 flex flex-wrap items-center gap-3">
        <span class="inline-block bg-accent/15 px-2 py-0.5 text-sm font-semibold text-accent">
          {{ request.statusLabel }}
        </span>
        <time class="text-sm tabular-nums text-ink-muted" :datetime="request.updatedAt">
          {{ formatUpdatedAt(request.updatedAt) }}
        </time>
      </p>

      <ol class="mt-8 space-y-2">
        <li v-for="stage in request.stages" :key="stage.status">
          <span :class="stampClass(stage, request.status)">{{ stage.label }}</span>
        </li>
      </ol>

      <table class="mt-8 w-full border-collapse text-left">
        <caption class="mb-3 text-left font-semibold text-ink">
          Спецификация
        </caption>
        <thead>
          <tr class="border-b border-rule text-sm text-ink-muted">
            <th class="py-2 pr-4 font-semibold">Наименование</th>
            <th class="py-2 pr-4 font-semibold">Кол-во</th>
            <th class="py-2 pr-4 font-semibold">Ед.</th>
            <th class="py-2 font-semibold">Комментарий</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in request.specLines" :key="line.name" class="border-b border-rule">
            <td class="py-3 pr-4 text-ink">{{ line.name }}</td>
            <td class="py-3 pr-4 tabular-nums text-ink">{{ line.quantity }}</td>
            <td class="py-3 pr-4 text-ink">{{ line.unit }}</td>
            <td class="py-3 text-ink-muted">{{ line.comment }}</td>
          </tr>
        </tbody>
      </table>

      <h2 class="mt-8 font-semibold text-ink">Файлы</h2>
      <ul class="mt-3 divide-y divide-rule">
        <li v-for="file in request.files" :key="file.fileName" class="py-3 text-ink">
          {{ file.fileName }}
        </li>
      </ul>
    </template>
  </main>
</template>
