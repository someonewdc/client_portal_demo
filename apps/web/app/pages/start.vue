<script setup lang="ts">
import { useSeoMeta } from 'nuxt/app';

useSeoMeta({
  title: 'Подать заявку — ПК «Нордщит»',
});
</script>

<template>
  <main>
    <h1 class="document-display">Подать заявку</h1>
    <p class="mt-3 text-ink">
      Щит, НКУ или комплект с полки не купить. Заявку на заводе принимают письмом или через
      менеджера. Эта кнопка заменяет такой вход и сразу открывает ссылку заказчика.
    </p>
    <p class="mt-2 text-ink">
      После отправки откроется та же ссылка, которую менеджер отправил бы в мессенджер.
    </p>
    <form action="/api/start-request" class="mt-8" method="post">
      <button class="live-control" type="submit">Подать заявку</button>
    </form>
  </main>
</template>
