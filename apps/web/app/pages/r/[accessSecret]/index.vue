<script setup lang="ts">
import { setResponseStatus, useSeoMeta } from 'nuxt/app';
import { computed } from 'vue';

import { useRequestPortal } from '~/composables/useRequestPortal';
import { documentStatusFromAsyncData } from '~/utils/async-data-problem';
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
    <section v-else-if="isNotFound" role="alert">
      <h1 class="text-xl font-semibold text-ink">Ссылка недействительна</h1>
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
      <p class="text-sm text-ink-muted">Статус заявки</p>
      <h1 class="mt-2 text-xl font-semibold text-ink">{{ currentStatusLabel }}</h1>
      <p class="mt-2 text-xl tabular-nums text-ink">{{ request.publicNumber }}</p>
      <p class="mt-2 text-ink">Менеджер отправил вам эту ссылку. Вход не нужен.</p>
      <dl class="mt-4">
        <dt class="text-sm text-ink-muted">Заказчик</dt>
        <dd class="mt-1 text-ink">{{ request.counterpartyName }}</dd>
        <dt class="mt-2 text-sm text-ink-muted">Изделие</dt>
        <dd class="mt-1 text-ink-muted">{{ request.title }}</dd>
        <dt class="mt-4 text-sm text-ink-muted">Обновлено</dt>
        <dd class="mt-1">
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
          class="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-3"
          role="listitem"
          :aria-current="stage.status === request.status ? 'step' : undefined"
        >
          <span class="flex items-baseline gap-3">
            <span class="tabular-nums text-sm text-ink-muted">{{ index + 1 }}</span>
            <span :class="stampClass(stage, request.status)">
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

      <table class="mt-8 w-full min-w-0 max-w-full border-collapse text-left">
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

      <h2 class="mt-8 font-semibold text-ink">Файлы</h2>
      <p class="mt-3 text-ink">Имя открывает выписку на экране.</p>
      <ul class="mt-3 divide-y divide-rule" aria-label="Файлы" role="list">
        <li
          v-for="file in request.files"
          :key="file.fileName"
          class="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 py-3 text-ink sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
          role="listitem"
        >
          <span class="text-sm font-semibold text-ink-muted">{{ fileKindLabel(file.kind) }}</span>
          <NuxtLink
            class="document-link min-w-0 break-words"
            :to="requestFileHref(accessSecret, file.fileName)"
          >
            {{ file.fileName }}
          </NuxtLink>
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
