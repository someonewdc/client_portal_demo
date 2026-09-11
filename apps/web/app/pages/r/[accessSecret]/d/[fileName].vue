<script setup lang="ts">
import { setResponseStatus, useRoute, useSeoMeta } from 'nuxt/app';
import { computed } from 'vue';

import { useRequestPortal } from '~/composables/useRequestPortal';
import { documentStatusFromAsyncData } from '~/utils/async-data-problem';
import {
  fileKindLabel,
  fileSheetLead,
  formatByteSize,
  formatRequestUpdatedAt,
} from '~/utils/request-file-display';
import { routeParamValue } from '~/utils/route-param-value';

const route = useRoute();
const { accessSecret, error, errorTraceId, isNotFound, request, status } = await useRequestPortal();

const fileName = computed(() => routeParamValue(route.params.fileName));

const file = computed(() => request.value?.files.find((item) => item.fileName === fileName.value));
const isMissingFile = computed(
  () =>
    status.value !== 'pending' &&
    error.value == null &&
    request.value != null &&
    file.value == null,
);

const documentStatus = documentStatusFromAsyncData(error.value, isMissingFile.value ? 404 : 200);
if (documentStatus !== 200) {
  setResponseStatus(documentStatus);
}

useSeoMeta({
  title: computed(() =>
    isNotFound.value || isMissingFile.value
      ? 'Ссылка недействительна — ПК «Нордщит»'
      : 'ПК «Нордщит»',
  ),
});
</script>

<template>
  <main>
    <p v-if="status === 'pending'" class="text-ink-muted" role="status">Загрузка заявки…</p>
    <section v-else-if="isNotFound || isMissingFile" role="alert">
      <h1 class="text-xl font-semibold text-ink">Ссылка недействительна</h1>
      <p class="mt-3 text-ink-muted">
        Заявки по этой ссылке нет. Проверьте адрес или попросите новую ссылку у менеджера.
      </p>
      <p v-if="errorTraceId" class="mt-4 tabular-nums text-ink-muted">
        Код ошибки: {{ errorTraceId }}
      </p>
    </section>
    <p v-else-if="error" class="text-ink" role="alert">
      Не удалось загрузить заявку.
      <span v-if="errorTraceId" class="mt-2 block tabular-nums text-ink-muted">
        Код ошибки: {{ errorTraceId }}
      </span>
    </p>
    <template v-else-if="request && file">
      <p class="text-sm font-semibold text-ink-muted">{{ fileKindLabel(file.kind) }}</p>
      <h1 class="mt-2 text-xl font-semibold text-ink">{{ file.fileName }}</h1>
      <p class="mt-4 tabular-nums text-ink">{{ request.publicNumber }}</p>
      <p class="mt-1 text-ink">{{ request.counterpartyName }}</p>
      <p class="mt-1 text-ink-muted">{{ request.title }}</p>
      <p class="mt-4">
        <time class="text-sm tabular-nums text-ink-muted" :datetime="file.uploadedAt">
          {{ formatRequestUpdatedAt(file.uploadedAt) }}
        </time>
        <span class="ml-3 tabular-nums text-sm text-ink-muted">{{
          formatByteSize(file.byteSize)
        }}</span>
      </p>
      <p class="mt-8 text-ink">{{ fileSheetLead(file.kind) }}</p>
      <ul class="mt-4 space-y-2">
        <li v-for="line in request.specLines" :key="line.name" class="text-ink">
          {{ line.name }}
        </li>
      </ul>
      <p class="mt-8">
        <NuxtLink
          class="underline decoration-rule underline-offset-2 hover:text-accent"
          :to="`/r/${accessSecret}`"
        >
          К заявке {{ request.publicNumber }}
        </NuxtLink>
      </p>
    </template>
  </main>
</template>
