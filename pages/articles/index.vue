<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import type { ArticleRecord } from '~/types/content-studio'
import { formatDisplayDate } from '~/utils/display'
import { getFetchStatusMessage } from '~/utils/fetch-error'

useSeoMeta({
  title: '文章',
  description: '查看已发布的技术文章，记录前端、后端开发问题与项目复盘'
})

const {
  data: articles,
  pending,
  error,
  refresh
} = useLazyFetch<ArticleRecord[]>('/api/articles', {
  default: () => []
})

const articlesErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '已发布文章暂时无法加载'
})

const featuredArticle = computed(() => {
  return articles.value.find((item) => item.isFeatured) ?? articles.value[0] ?? null
})

const restArticles = computed(() => {
  if (!featuredArticle.value) {
    return []
  }

  return articles.value.filter((item) => item.id !== featuredArticle.value?.id)
})
</script>

<template>
  <div class="app-container app-section">
    <AppSectionHeading
      eyebrow="文章归档"
      title="按时间整理技术文章"
      description="发布后的文章会同步到归档、专题和搜索。"
      title-class="single-line-xl"
      description-class="single-line-xl"
    />

    <AppLoadingState
      v-if="pending"
      class="mt-8"
      title="正在加载文章归档"
      description="正在读取已发布文章列表，请稍候"
    />

    <AppErrorState
      v-else-if="error"
      class="mt-8"
      title="文章归档暂不可用"
      :description="articlesErrorMessage"
      @action="refresh"
    />

    <div v-else-if="featuredArticle" class="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <AppSurface class="space-y-5">
        <div class="flex flex-wrap items-center gap-3">
          <AppStatusPill tone="accent">推荐文章</AppStatusPill>
          <NuxtLink v-if="featuredArticle.topic" :to="`/topics/${featuredArticle.topic.slug}`">
            <AppStatusPill>{{ featuredArticle.topic.name }}</AppStatusPill>
          </NuxtLink>
          <AppStatusPill v-else>未分配专题</AppStatusPill>
          <AppStatusPill>{{ featuredArticle.readingTime }} 分钟</AppStatusPill>
        </div>
        <div class="space-y-4">
          <h1 class="max-w-3xl text-[2.4rem] font-semibold tracking-tight leading-[1.02] md:text-[3.5rem]">
            {{ featuredArticle.title }}
          </h1>
          <p class="max-w-3xl body-copy">
            {{ featuredArticle.summary }}
          </p>
        </div>
        <p class="max-w-3xl body-copy">{{ featuredArticle.excerpt }}</p>
        <div class="flex flex-wrap gap-2">
          <NuxtLink v-for="tag in featuredArticle.tags" :key="tag.id" :to="`/tags/${tag.slug}`">
            <AppStatusPill>{{ tag.name }}</AppStatusPill>
          </NuxtLink>
        </div>
        <NuxtLink
          :to="`/articles/${featuredArticle.slug}`"
          class="inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-warm"
        >
          阅读文章
          <ArrowRight class="size-4" />
        </NuxtLink>
      </AppSurface>

      <AppSurface class="space-y-4">
        <p class="eyebrow">内容流转状态</p>
        <h2 class="panel-title single-line-md">文章列表已接入统一内容源</h2>
        <p class="body-copy">
          文章归档、专题页和搜索页读取同一套已发布内容。
        </p>
        <div class="grid gap-3 pt-2">
          <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">内容来源</p>
            <p class="mt-2 body-copy">
              标题、摘要、正文、专题、标签和发布时间来自后台内容 API。
            </p>
          </div>
          <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">阅读入口</p>
            <p class="mt-2 body-copy">
              可通过专题、标签和搜索继续查找相关内容。
            </p>
          </div>
        </div>
      </AppSurface>
    </div>

    <div v-if="!pending && !error && restArticles.length" class="mt-6 grid gap-5">
      <AppSurface
        v-for="article in restArticles"
        :key="article.id"
        class="grid gap-5 md:grid-cols-[1fr_auto]"
      >
        <div class="space-y-3">
          <div class="flex flex-wrap gap-2">
            <NuxtLink v-if="article.topic" :to="`/topics/${article.topic.slug}`">
              <AppStatusPill>{{ article.topic.name }}</AppStatusPill>
            </NuxtLink>
            <AppStatusPill v-else>未分配专题</AppStatusPill>
            <AppStatusPill>{{ article.readingTime }} 分钟</AppStatusPill>
            <AppStatusPill>{{ formatDisplayDate(article.publishedAt) }}</AppStatusPill>
          </div>
          <div>
            <h2 class="panel-title">{{ article.title }}</h2>
            <p class="mt-2 max-w-3xl body-copy">
              {{ article.summary }}
            </p>
          </div>
          <p class="max-w-3xl body-copy">{{ article.excerpt }}</p>
        </div>
        <div class="flex items-center">
          <NuxtLink
            :to="`/articles/${article.slug}`"
            class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
          >
            阅读
            <ArrowRight class="size-4" />
          </NuxtLink>
        </div>
      </AppSurface>
    </div>

    <AppEmptyState
      v-if="!pending && !error && !featuredArticle"
      class="mt-8"
      title="暂时还没有已发布文章"
      description="请先在后台创建并发布第一篇文章，前台归档会自动同步更新"
    />
  </div>
</template>
