<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <AppSurface
    variant="ghost"
    class="flex flex-col gap-3 text-center"
    role="status"
    aria-live="polite"
  >
    <p class="eyebrow">暂无内容</p>
    <h3 class="text-xl font-semibold">{{ title }}</h3>
    <p v-if="description" class="mx-auto max-w-lg body-copy">
      {{ description }}
    </p>
    <div class="mx-auto mt-2 h-px w-24 bg-line/20" />
  </AppSurface>
</template>
