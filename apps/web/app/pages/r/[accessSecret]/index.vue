<script setup lang="ts">
import { setResponseStatus, useSeoMeta } from 'nuxt/app';
import { computed } from 'vue';

import { useRequestPortal } from '~/composables/useRequestPortal';
import { documentStatusFromAsyncData } from '~/utils/async-data-problem';
import { LIVE_CABINET_POLL_HINT, shouldPollLiveCabinet } from '~/utils/live-cabinet-poll';
import {
  fileKindLabel,
  formatByteSize,
  formatRequestUpdatedAt,
  requestFileHref,
} from '~/utils/request-file-display';
import { requestNextStepPhrase } from '~/utils/request-next-step';

const { accessSecret, error, errorTraceId, isNotFound, request, status } = await useRequestPortal();

const currentStatusLabel = computed(() => {
  const payload = request.value;
  if (payload == null) {
    return '';
  }

  return payload.stages.find((stage) => stage.status === payload.status)?.label ?? '';
});

useSeoMeta({
  title: computed(() => {
    if (isNotFound.value) {
      return 'Ссылка недействительна — ПК «Нордщит»';
    }

    const payload = request.value;
    const statusLabel = currentStatusLabel.value;
    if (payload == null || statusLabel === '') {
      return 'ПК «Нордщит»';
    }

    return `${statusLabel} — ${payload.publicNumber} — ПК «Нордщит»`;
  }),
});

const documentStatus = documentStatusFromAsyncData(error.value);
if (documentStatus !== 200) {
  setResponseStatus(documentStatus);
}

const hasSpecComments = computed(
  () => request.value?.specLines.some((line) => Boolean(line.comment)) === true,
);

const showLivePollHint = computed(() => shouldPollLiveCabinet(request.value));

function stampClass(stage: { reachedAt: string | null; status: string }, currentStatus: string) {
  if (stage.status === currentStatus) {
    return 'status-stamp text-sm';
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
    <section v-else-if="isNotFound" role="alert">
      <h1 class="document-display">Ссылка недействительна</h1>
      <p class="mt-3 text-ink-muted">
        Заявки по этой ссылке нет. Проверьте адрес или попросите новую ссылку у менеджера.
      </p>
    </section>
    <p v-else-if="error" class="text-ink" role="alert">
      Не удалось загрузить заявку.
      <span v-if="errorTraceId" class="mt-2 block tabular-nums text-ink-muted">
        Код ошибки: {{ errorTraceId }}
      </span>
    </p>
    <template v-else-if="request">
      <p class="document-caption">Статус заявки</p>
      <h1 class="document-display mt-1">{{ currentStatusLabel }}</h1>
      <p class="document-identity mt-2 tabular-nums">{{ request.publicNumber }}</p>
      <p class="mt-4 text-ink">Менеджер отправил вам эту ссылку. Вход не нужен.</p>
      <p v-if="showLivePollHint" class="mt-4 text-ink">{{ LIVE_CABINET_POLL_HINT }}</p>
      <dl class="document-summary mt-4">
        <dt class="document-caption">Заказчик</dt>
        <dd class="mt-1 text-ink sm:mt-0">{{ request.counterpartyName }}</dd>
        <dt class="mt-2 document-caption sm:mt-0">Изделие</dt>
        <dd class="mt-1 text-ink sm:mt-0">{{ request.title }}</dd>
        <dt class="mt-4 document-caption sm:mt-0">Обновлено</dt>
        <dd class="mt-1 sm:mt-0">
          <time class="text-sm tabular-nums text-ink-muted" :datetime="request.updatedAt">
            {{ formatRequestUpdatedAt(request.updatedAt) }}
          </time>
        </dd>
      </dl>
      <p class="mt-4 text-ink">{{ requestNextStepPhrase(request.status) }}</p>

      <ol class="mt-8 space-y-3" aria-label="Этапы заявки" role="list">
        <li
          v-for="(stage, index) in request.stages"
          :key="stage.status"
          class="flex flex-col items-start gap-1 sm:grid sm:grid-cols-[2rem_minmax(0,1fr)_12rem] sm:items-baseline sm:gap-x-3"
          role="listitem"
          :aria-current="stage.status === request.status ? 'step' : undefined"
        >
          <span class="flex items-baseline gap-3 sm:contents">
            <span class="tabular-nums text-sm text-ink-muted">{{ index + 1 }}</span>
            <span :class="[stampClass(stage, request.status), 'w-fit']">
              <span>{{ stage.label }}</span>
              <span v-if="stage.status === request.status" class="sr-only">сейчас</span>
            </span>
          </span>
          <time
            v-if="stage.reachedAt !== null"
            class="text-sm tabular-nums text-ink-muted"
            :datetime="stage.reachedAt"
          >
            {{ formatRequestUpdatedAt(stage.reachedAt) }}
          </time>
          <span v-else class="text-sm text-ink-muted">ещё нет</span>
        </li>
      </ol>

      <table class="w-full min-w-0 max-w-full border-collapse text-left">
        <caption class="document-section text-left">
          Спецификация
        </caption>
        <thead class="max-sm:hidden">
          <tr class="border-b border-rule text-sm text-ink-muted">
            <th class="py-2 pr-4 font-semibold">Наименование</th>
            <th class="py-2 pr-4 font-semibold sm:min-w-[4.75rem] sm:whitespace-nowrap">Кол-во</th>
            <th class="py-2 pr-4 font-semibold sm:min-w-12 sm:whitespace-nowrap">Ед.</th>
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
            <td class="block py-1 text-ink sm:table-cell sm:min-w-[4.75rem] sm:py-3 sm:pr-4">
              <span class="block text-sm text-ink-muted sm:hidden">Кол-во</span>
              <span class="tabular-nums">{{ line.quantity }}</span>
            </td>
            <td class="block py-1 text-ink sm:table-cell sm:min-w-12 sm:py-3 sm:pr-4">
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

      <h2 class="document-section">Файлы</h2>
      <p class="mt-3 text-ink">Нажмите имя файла — откроется выписка на экране.</p>
      <ul class="mt-3 divide-y divide-rule" aria-label="Файлы" role="list">
        <li
          v-for="file in request.files"
          :key="file.fileName"
          class="grid grid-cols-[9rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 py-3 text-ink sm:grid-cols-[9rem_minmax(0,1fr)_4.5rem_12rem]"
          role="listitem"
        >
          <span class="text-sm font-semibold text-ink-muted">{{ fileKindLabel(file.kind) }}</span>
          <span class="min-w-0">
            <NuxtLink
              class="document-link break-words"
              :to="requestFileHref(accessSecret, file.fileName)"
            >
              {{ file.fileName }}
            </NuxtLink>
          </span>
          <span class="tabular-nums text-sm text-ink-muted">{{
            formatByteSize(file.byteSize)
          }}</span>
          <time class="text-sm tabular-nums text-ink-muted" :datetime="file.uploadedAt">
            {{ formatRequestUpdatedAt(file.uploadedAt) }}
          </time>
        </li>
      </ul>
    </template>
  </main>
</template>
