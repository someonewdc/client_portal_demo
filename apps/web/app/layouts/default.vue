<template>
  <div class="min-h-screen bg-paper font-sans text-ink">
    <div class="mx-auto max-w-document px-6 py-10">
      <header class="border-b border-rule pb-4">
        <p class="text-sm font-semibold text-accent">ПК «Нордщит»</p>
      </header>
      <div class="mt-8 bg-sheet px-6 py-8">
        <slot />
      </div>
    </div>
  </div>
</template>
