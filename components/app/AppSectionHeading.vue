<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow: string
  title: string
  description: string
  titleClass?: string
  descriptionClass?: string
}>(), {
  titleClass: '',
  descriptionClass: ''
})
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div class="min-w-0 max-w-[60rem] space-y-2.5">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2 class="section-title min-w-0" :class="titleClass">
        {{ title }}
      </h2>
      <p class="body-copy max-w-[54rem]" :class="descriptionClass">
        {{ description }}
      </p>
    </div>
    <slot name="action" />
  </div>
</template>
