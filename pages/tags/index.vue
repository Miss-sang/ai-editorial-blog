<script setup lang="ts">
import type { TagRecord } from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'

const config = useRuntimeConfig()

useSeoMeta({
  title: '标签',
  description: '按标签查看具体技术、工具和实现关键词'
})

useHead(() => ({
  link: [
    {
      rel: 'canonical',
      href: `${String(config.public.siteUrl || 'http://localhost:3000').replace(/\/+$/u, '')}/tags`
    }
  ]
}))

const {
  data: tags,
  pending,
  error,
  refresh
} = await useFetch<TagRecord[]>('/api/tags', {
  default: () => []
})

const tagsErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '标签列表暂时无法加载'
})
</script>

<template>
  <div class="app-container app-section">
    <AppSectionHeading
      eyebrow="标签索引"
      title="用标签快速检索具体技术、工具和实现细节"
      description="标签是专题之上的细粒度检索层，适合快速查看某项技术或某类实现方案"
      title-class="single-line-xl"
      description-class="single-line-xl"
    />

    <AppLoadingState
      v-if="pending"
      class="mt-8"
      title="正在加载标签索引"
      description="正在读取公开标签与对应文章数量"
    />

    <AppErrorState
      v-else-if="error"
      class="mt-8"
      title="标签索引暂不可用"
      :description="tagsErrorMessage"
      @action="refresh"
    />

    <div v-else-if="tags.length" class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <NuxtLink
        v-for="tag in tags"
        :key="tag.id"
        :to="`/tags/${tag.slug}`"
        class="surface-frame block p-5 transition hover:border-accent/25 hover:bg-surface-muted/60"
      >
        <div class="flex flex-wrap items-center gap-2">
          <AppStatusPill>标签</AppStatusPill>
          <AppStatusPill tone="warning">{{ tag.articleCount }} 篇文章</AppStatusPill>
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-tight">{{ tag.name }}</h2>
        <p class="mt-2 text-sm leading-7 text-ink-soft">
          用于横向检索同类技术点、工具链或实现细节的辅助标签
        </p>
      </NuxtLink>
    </div>

    <AppEmptyState
      v-else
      class="mt-8"
      title="暂时还没有公开标签"
      description="请先在后台为文章设置标签并发布，前台标签索引会自动更新"
    />
  </div>
</template>
