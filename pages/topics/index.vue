<script setup lang="ts">
import type { TopicRecord } from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'

const config = useRuntimeConfig()

useSeoMeta({
  title: '专题',
  description: '按专题浏览技术博客的主知识结构'
})

useHead(() => ({
  link: [
    {
      rel: 'canonical',
      href: `${String(config.public.siteUrl || 'http://localhost:3000').replace(/\/+$/u, '')}/topics`
    }
  ]
}))

const {
  data: topics,
  pending,
  error,
  refresh
} = useLazyFetch<TopicRecord[]>('/api/topics', {
  default: () => []
})

const topicsErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '专题列表暂时无法加载'
})
</script>

<template>
  <div class="app-container app-section">
    <AppSectionHeading
      eyebrow="专题导航"
      title="按文章分类浏览专题"
      description="每个专题补充对应说明，便于连续阅读。"
      title-class="single-line-xl"
      description-class="single-line-xl"
    />

    <AppLoadingState
      v-if="pending"
      class="mt-8"
      title="正在加载专题导航"
      description="正在读取公开专题及对应文章数量"
    />

    <AppErrorState
      v-else-if="error"
      class="mt-8"
      title="专题导航暂不可用"
      :description="topicsErrorMessage"
      @action="refresh"
    />

    <div v-else-if="topics.length" class="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="topic in topics"
        :key="topic.id"
        :to="`/topics/${topic.slug}`"
        class="surface-frame block p-6 transition hover:border-accent/25 hover:bg-surface-muted/60"
      >
        <div class="flex flex-wrap items-center gap-2">
          <AppStatusPill tone="accent">专题</AppStatusPill>
          <AppStatusPill>{{ topic.articleCount }} 篇文章</AppStatusPill>
        </div>
        <h2 class="mt-4 panel-title">{{ topic.name }}</h2>
        <p class="mt-3 body-copy">
          {{ topic.description || '这一类文章的归档与实践记录。' }}
        </p>
        <p class="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
          进入专题
        </p>
      </NuxtLink>
    </div>

    <AppEmptyState
      v-else
      class="mt-8"
      title="暂时还没有公开专题"
      description="请先在后台为文章设置专题并发布，前台专题导航会自动生成"
    />
  </div>
</template>
