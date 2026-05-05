<script setup lang="ts">
defineProps<{
  title: string
  eyebrow?: string
  description?: string
  titleId?: string
}>()
</script>

<template>
  <div class="blog-section-title">
    <p v-if="eyebrow" class="blog-section-eyebrow">{{ eyebrow }}</p>
    <h2 :id="titleId">{{ title }}</h2>
    <p v-if="description" class="blog-section-description">
      {{ description }}
    </p>
  </div>
</template>
