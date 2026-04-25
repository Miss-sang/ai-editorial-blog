<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: '正在加载内容',
    description: '正在从服务端获取最新内容，请稍候'
  }
)
</script>

<template>
  <AppSurface variant="ghost" class="flex flex-col items-center gap-3 text-center" role="status" aria-live="polite">
    <LoaderCircle class="size-5 animate-spin text-accent" />
    <div class="space-y-2">
      <h3 class="text-xl font-semibold text-ink-strong">{{ title }}</h3>
      <p class="mx-auto max-w-lg body-copy">
        {{ description }}
      </p>
    </div>
  </AppSurface>
</template>
