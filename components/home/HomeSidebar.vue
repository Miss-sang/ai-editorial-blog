<script setup lang="ts">
import { Archive, Search } from 'lucide-vue-next'
import type { ArticleRecord, TopicRecord } from '~/types/content-studio'
import { formatDisplayDate } from '~/utils/display'

const props = defineProps<{
  aiArticles: ArticleRecord[]
  topics: TopicRecord[]
}>()

const archiveYears = computed(() => {
  const years = new Map<string, number>()

  for (const article of props.aiArticles) {
    const sourceDate = article.publishedAt || article.createdAt
    const year = sourceDate ? new Date(sourceDate).getFullYear().toString() : '未发布'
    years.set(year, (years.get(year) || 0) + 1)
  }

  if (!years.size) {
    years.set(new Date().getFullYear().toString(), 0)
  }

  return Array.from(years.entries()).map(([year, count]) => ({ year, count }))
})

</script>

<template>
  <aside class="blog-sidebar" aria-label="首页侧栏">
    <HomeSidebarSection title="阅读表">
      <div v-if="aiArticles.length" class="blog-reading-list">
        <NuxtLink
          v-for="article in aiArticles"
          :key="article.id"
          :to="`/articles/${article.slug}`"
        >
          <HomeNoteThumbnail
            :src="article.coverImageUrl"
            :title="article.title"
          />
          <span>
            <strong>{{ article.title }}</strong>
            <small>{{ article.topic?.name || formatDisplayDate(article.publishedAt) }}</small>
          </span>
        </NuxtLink>
      </div>
      <p v-else class="blog-side-copy">暂无内容</p>
    </HomeSidebarSection>

    <HomeSidebarSection title="归档">
      <div class="blog-archive-list">
        <NuxtLink
          v-for="item in archiveYears"
          :key="item.year"
          to="/articles"
        >
          <Archive class="size-3.5" />
          <span>{{ item.year }}</span>
          <small>{{ item.count }} 篇文章</small>
        </NuxtLink>
      </div>
    </HomeSidebarSection>

    <HomeSidebarSection title="常用入口">
      <div class="blog-quick-links">
        <NuxtLink to="/search">
          <Search class="size-3.5" />
          站内搜索
        </NuxtLink>
        <NuxtLink to="/labs">Prompt Lab</NuxtLink>
        <NuxtLink to="/projects">项目案例</NuxtLink>
        <NuxtLink to="/topics">专题地图</NuxtLink>
      </div>
    </HomeSidebarSection>

    <HomeSidebarSection title="专题">
      <div v-if="topics.length" class="blog-topic-list">
        <NuxtLink
          v-for="topic in topics"
          :key="topic.id"
          :to="`/topics/${topic.slug}`"
        >
          <span>{{ topic.name }}</span>
          <small>{{ topic.articleCount }} 篇</small>
        </NuxtLink>
      </div>
      <p v-else class="blog-side-copy">暂无专题</p>
    </HomeSidebarSection>

  </aside>
</template>
