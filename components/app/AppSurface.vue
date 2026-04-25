<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    as?: string
    variant?: 'default' | 'strong' | 'ghost'
    padded?: boolean
  }>(),
  {
    as: 'section',
    variant: 'default',
    padded: true
  }
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'strong':
      return 'surface-frame-strong'
    case 'ghost':
      return 'rounded-shell border border-dashed border-line/20 bg-transparent'
    default:
      return 'surface-frame'
  }
})
</script>

<template>
  <component :is="as" :class="[variantClasses, padded ? 'p-6 md:p-8' : '']">
    <slot />
  </component>
</template>
