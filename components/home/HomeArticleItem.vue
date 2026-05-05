<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { ArticleRecord } from '~/types/content-studio'
import { formatDisplayDate } from '~/utils/display'

defineProps<{
  article: ArticleRecord
  index: number
}>()
</script>

<template>
  <article class="blog-entry">
    <HomeNoteThumbnail
      :src="article.coverImageUrl"
      :title="article.title"
      :index="index"
    />

    <div class="blog-entry-body">
      <div class="blog-entry-meta">
        <span>{{ formatDisplayDate(article.publishedAt) }}</span>
        <span v-if="article.topic">{{ article.topic.name }}</span>
        <span>{{ article.readingTime }} 分钟阅读</span>
      </div>

      <h3>
        <NuxtLink :to="`/articles/${article.slug}`">
          {{ article.title }}
        </NuxtLink>
      </h3>

      <p>{{ article.summary || article.excerpt }}</p>

      <div class="blog-entry-footer">
        <div class="blog-entry-tags">
          <span
            v-for="tag in article.tags.slice(0, 3)"
            :key="tag.id"
          >
            {{ tag.name }}
          </span>
        </div>
        <NuxtLink :to="`/articles/${article.slug}`" class="blog-read-link">
          阅读全文
          <ArrowUpRight class="size-3.5" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
