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

const hasSpecComments = computed(
  () => request.value?.specLines.some((line) => Boolean(line.comment)) === true,
);

useSeoMeta({
  title: computed(() => {
    if (isNotFound.value || isMissingFile.value) {
      return 'Ссылка недействительна — ПК «Нордщит»';
    }

    const payload = request.value;
    const currentFile = file.value;
    if (payload == null || currentFile == null) {
      return 'ПК «Нордщит»';
    }

    return `${fileKindLabel(currentFile.kind)} — ${payload.publicNumber} — ПК «Нордщит»`;
  }),
});
</script>

<template>
  <main>
    <p v-if="status === 'pending'" class="text-ink-muted" role="status">Загрузка заявки…</p>
    <section v-else-if="isNotFound" role="alert">
      <h1 class="text-xl font-semibold text-ink">Ссылка недействительна</h1>
      <p class="mt-3 text-ink-muted">
        Заявки по этой ссылке нет. Проверьте адрес или попросите новую ссылку у менеджера.
      </p>
    </section>
    <section v-else-if="isMissingFile && request" role="alert">
      <h1 class="text-xl font-semibold text-ink">Ссылка недействительна</h1>
      <p class="mt-3 text-ink-muted">
        Такого документа в заявке нет. Откройте заявку и выберите имя из списка.
      </p>
      <p class="mt-8">
        <NuxtLink class="document-link" :to="`/r/${accessSecret}`">
          <span aria-hidden="true">← </span>К заявке {{ request.publicNumber }}
        </NuxtLink>
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
      <dl class="mt-4">
        <dt class="text-sm text-ink-muted">Заказчик</dt>
        <dd class="mt-1 text-ink">{{ request.counterpartyName }}</dd>
        <dt class="mt-2 text-sm text-ink-muted">Изделие</dt>
        <dd class="mt-1 text-ink-muted">{{ request.title }}</dd>
        <dt class="mt-4 text-sm text-ink-muted">Загружено</dt>
        <dd class="mt-1">
          <time class="text-sm tabular-nums text-ink-muted" :datetime="file.uploadedAt">
            {{ formatRequestUpdatedAt(file.uploadedAt) }}
          </time>
        </dd>
        <dt class="mt-2 text-sm text-ink-muted">Размер</dt>
        <dd class="mt-1 tabular-nums text-sm text-ink-muted">
          {{ formatByteSize(file.byteSize) }}
        </dd>
      </dl>
      <p class="mt-4 text-ink">Это выписка на экране, не файл для скачивания.</p>
      <p class="mt-8 text-ink">{{ fileSheetLead(file.kind) }}</p>
      <table class="mt-4 w-full min-w-0 max-w-full border-collapse text-left">
        <caption class="mb-3 text-left font-semibold text-ink">
          Спецификация
        </caption>
        <thead class="max-sm:hidden">
          <tr class="border-b border-rule text-sm text-ink-muted">
            <th class="py-2 pr-4 font-semibold">Наименование</th>
            <th class="py-2 pr-4 font-semibold">Кол-во</th>
            <th class="py-2 pr-4 font-semibold">Ед.</th>
            <th v-if="hasSpecComments" class="py-2 font-semibold">Комментарий</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="line in request.specLines"
            :key="line.name"
            class="block border-b border-rule py-3 sm:table-row sm:py-0"
          >
            <td class="block py-1 text-ink sm:table-cell sm:py-3 sm:pr-4">
              <span class="block text-sm text-ink-muted sm:hidden">Наименование</span>
              <span class="break-words">{{ line.name }}</span>
            </td>
            <td class="block py-1 text-ink sm:table-cell sm:py-3 sm:pr-4">
              <span class="block text-sm text-ink-muted sm:hidden">Кол-во</span>
              <span class="tabular-nums">{{ line.quantity }}</span>
            </td>
            <td class="block py-1 text-ink sm:table-cell sm:py-3 sm:pr-4">
              <span class="block text-sm text-ink-muted sm:hidden">Ед.</span>
              <span>{{ line.unit }}</span>
            </td>
            <td v-if="hasSpecComments" class="block py-1 text-ink-muted sm:table-cell sm:py-3">
              <span class="block text-sm sm:hidden">Комментарий</span>
              <span class="break-words">{{ line.comment }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="mt-8">
        <NuxtLink class="document-link" :to="`/r/${accessSecret}`">
          <span aria-hidden="true">← </span>К заявке {{ request.publicNumber }}
        </NuxtLink>
      </p>
    </template>
  </main>
</template>
