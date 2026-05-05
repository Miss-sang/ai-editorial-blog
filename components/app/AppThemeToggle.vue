<script setup lang="ts">
import { MoonStar, SunMedium } from 'lucide-vue-next'

const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value: boolean) => {
    colorMode.preference = value ? 'dark' : 'light'
  }
})
</script>

<template>
  <button
    type="button"
    class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[7px] border border-line/[0.15] bg-surface/80 px-3 py-2 text-sm text-ink-soft transition hover:border-accent/30 hover:text-ink-strong"
    :aria-pressed="isDark"
    @click="isDark = !isDark"
  >
    <component :is="isDark ? SunMedium : MoonStar" class="size-4" />
    <span class="font-mono text-[11px] uppercase tracking-[0.18em]">
      {{ isDark ? '浅色' : '深色' }}
    </span>
  </button>
</template>
