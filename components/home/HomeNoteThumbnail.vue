<script setup lang="ts">
const props = defineProps<{
  src?: string | null
  title: string
  index?: number
}>()

const noteLines = computed(() => {
  const seed = props.title.length + (props.index ?? 0)
  return Array.from({ length: 5 }, (_, lineIndex) => {
    const width = 42 + ((seed + lineIndex * 13) % 42)
    return `${width}%`
  })
})
</script>

<template>
  <div class="blog-entry-thumb" aria-hidden="true">
    <img v-if="src" :src="src" :alt="title" loading="lazy">
    <div v-else class="blog-note-thumb">
      <div class="blog-note-thumb-pin" />
      <span
        v-for="(width, lineIndex) in noteLines"
        :key="lineIndex"
        :style="{ width }"
      />
      <div class="blog-note-thumb-diagram">
        <i />
        <i />
        <i />
      </div>
    </div>
  </div>
</template>
