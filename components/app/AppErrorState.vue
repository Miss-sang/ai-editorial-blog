<script setup lang="ts">
import { AlertCircle, RefreshCcw } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title?: string
    description: string
    actionLabel?: string
  }>(),
  {
    title: '加载失败',
    actionLabel: '重新加载'
  }
)

const emit = defineEmits<{
  (event: 'action'): void
}>()
</script>

<template>
  <AppSurface variant="ghost" class="flex flex-col gap-4 text-center" role="alert">
    <div class="mx-auto inline-flex size-12 items-center justify-center rounded-full border border-danger/20 bg-danger/10 text-danger">
      <AlertCircle class="size-5" />
    </div>
    <div class="space-y-2">
      <h3 class="text-xl font-semibold text-ink-strong">{{ title }}</h3>
      <p class="mx-auto max-w-lg body-copy">
        {{ description }}
      </p>
    </div>
    <div class="flex justify-center">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
        @click="emit('action')"
      >
        <RefreshCcw class="size-4" />
        {{ actionLabel }}
      </button>
    </div>
  </AppSurface>
</template>
