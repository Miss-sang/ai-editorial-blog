<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3 border-b border-line/10 pb-5 md:flex-row md:items-end md:justify-between">
    <div class="min-w-0 max-w-full space-y-2.5">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h1 class="single-line-2xl text-[1.65rem] font-semibold tracking-tight leading-[1.06] md:text-[1.9rem]">
        {{ title }}
      </h1>
      <p class="body-copy max-w-[56rem] single-line-xl">
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
