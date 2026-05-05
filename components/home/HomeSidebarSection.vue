<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="blog-side-section">
    <h2>{{ title }}</h2>
    <slot />
  </section>
</template>
