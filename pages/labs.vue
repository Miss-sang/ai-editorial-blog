<script setup lang="ts">
import { BrainCircuit, Sparkles } from 'lucide-vue-next'
import type { ArticleRecord } from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'

const isAiArticle = (article: ArticleRecord) => {
  const haystack = [
    article.title,
    article.summary,
    article.topic?.name || '',
    ...article.tags.map((tag) => tag.name)
  ]
    .join(' ')
    .toLowerCase()

  return ['ai', '大模型', '模型', '提示词', '平台', '智能体'].some((keyword) =>
    haystack.includes(keyword.toLowerCase())
  )
}

useSeoMeta({
  title: 'AI',
  description: '集中查看 AI 工具、模型入口和相关文章'
})

const {
  data: articles,
  pending,
  error,
  refresh
} = useLazyFetch<ArticleRecord[]>('/api/articles', {
  default: () => []
})

const aiArticles = computed(() => articles.value.filter(isAiArticle))
const featuredAiArticle = computed(() => aiArticles.value[0] ?? null)
const pageErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || 'AI 内容暂时无法加载'
})
</script>

<template>
  <div class="app-container app-section">
    <AppSectionHeading
      eyebrow="AI 专区"
      title="集中整理 AI 工具、模型入口与相关文章"
      description="这一页用于承接 AI 工具、模型入口与相关实践文章，作为技术博客中的专题补充入口"
      title-class="single-line-xl"
      description-class="single-line-xl"
    />

    <AppLoadingState
      v-if="pending"
      class="mt-8"
      title="正在加载 AI 内容"
      description="正在读取 AI 相关文章和专题入口"
    />

    <AppErrorState
      v-else-if="error"
      class="mt-8"
      title="AI 内容暂不可用"
      :description="pageErrorMessage"
      @action="refresh"
    />

    <template v-else>
      <AppSurface v-if="featuredAiArticle" class="mt-8 space-y-4">
        <div class="flex items-center gap-3">
          <BrainCircuit class="size-5 text-accent" />
          <h2 class="panel-title">推荐阅读</h2>
        </div>
        <h3 class="panel-title">{{ featuredAiArticle.title }}</h3>
        <p class="body-copy">{{ featuredAiArticle.summary }}</p>
        <NuxtLink
          :to="`/articles/${featuredAiArticle.slug}`"
          class="inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-warm"
        >
          进入文章
        </NuxtLink>
      </AppSurface>

      <div class="mt-6 grid gap-5 lg:grid-cols-2">
        <AppSurface class="space-y-4">
          <div class="flex items-center gap-3">
            <Sparkles class="size-5 text-accent-warm" />
            <h2 class="panel-title">关注方向</h2>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppStatusPill>大模型平台</AppStatusPill>
            <AppStatusPill>提示词实践</AppStatusPill>
            <AppStatusPill>AI 阅读辅助</AppStatusPill>
            <AppStatusPill>内容生产工具</AppStatusPill>
          </div>
          <p class="body-copy">
            这里会持续整理常见 AI 工具、模型入口与内容生产相关实践，后续也会承接更多专题文章
          </p>
        </AppSurface>

        <AppSurface class="space-y-4">
          <div class="flex items-center gap-3">
            <BrainCircuit class="size-5 text-accent" />
            <h2 class="panel-title">相关文章</h2>
          </div>
          <div v-if="aiArticles.length" class="grid gap-3">
            <NuxtLink
              v-for="article in aiArticles"
              :key="article.id"
              :to="`/articles/${article.slug}`"
              class="rounded-3xl border border-line/10 bg-surface-muted/45 p-4 transition hover:border-accent/25 hover:bg-surface-muted/70"
            >
              <p class="text-base font-semibold text-ink-strong">{{ article.title }}</p>
              <p class="mt-2 body-copy">{{ article.summary }}</p>
            </NuxtLink>
          </div>
          <p v-else class="body-copy">
            当前还没有标记为 AI 方向的已发布文章，后续可在后台继续补充
          </p>
        </AppSurface>
      </div>

      <AppSurface class="mt-6 space-y-4">
        <div class="flex items-center gap-3">
          <Sparkles class="size-5 text-accent-warm" />
          <h2 class="panel-title">后续可扩展方向</h2>
        </div>
        <p class="body-copy">
          后续可以继续补充平台测评、提示词对比、AI 阅读辅助、工作流自动化以及模型能力边界分析等内容
        </p>
      </AppSurface>
    </template>
  </div>
</template>
