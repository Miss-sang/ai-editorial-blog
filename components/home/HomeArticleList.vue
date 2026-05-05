<script setup lang="ts">
import type { ArticleRecord } from '~/types/content-studio'

defineProps<{
  articles: ArticleRecord[]
}>()
</script>

<template>
  <section class="blog-main-panel" aria-labelledby="latest-articles-title">
    <HomeSectionTitle
      title="最近更新"
      title-id="latest-articles-title"
      eyebrow="Latest"
    />

    <div v-if="articles.length" class="blog-entry-list">
      <HomeArticleItem
        v-for="(article, index) in articles"
        :key="article.id"
        :article="article"
        :index="index"
      />
    </div>

    <AppEmptyState
      v-else
      title="暂无文章"
    />

    <NuxtLink
      v-if="articles.length"
      to="/articles"
      class="blog-more-link"
    >
      查看全部文章
    </NuxtLink>
  </section>
</template>
