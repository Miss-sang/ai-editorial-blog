<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tone?: 'neutral' | 'accent' | 'success' | 'warning'
  }>(),
  {
    tone: 'neutral'
  }
)

const toneClasses = computed(() => {
  switch (props.tone) {
    case 'accent':
      return 'border-accent/30 bg-accent/10 text-accent'
    case 'success':
      return 'border-success/30 bg-success/10 text-success'
    case 'warning':
      return 'border-warning/30 bg-warning/10 text-warning'
    default:
      return 'border-line/[0.15] bg-surface-muted/70 text-ink-soft'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em]"
    :class="toneClasses"
  >
    <span class="size-1.5 rounded-full bg-current" />
    <slot />
  </span>
</template>
