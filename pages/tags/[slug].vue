<script setup lang="ts">
import type { PublicTagPagePayload } from '~/types/public-discovery'
import { formatDisplayDate } from '~/utils/display'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug || ''))

const { data, pending, error } = await useFetch<PublicTagPagePayload>(() => `/api/tags/${slug.value}`, {
  watch: [slug]
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || '标签不存在'
  })
}

const tag = computed(() => data.value?.tag || null)
const articles = computed(() => data.value?.articles || [])

useSeoMeta({
  title: () => (tag.value ? `${tag.value.name} 标签` : '标签'),
  description: () =>
    `查看带有 ${tag.value?.name || '当前'} 标签的已发布文章`
})

useHead(() => ({
  link: [
    {
      rel: 'canonical',
      href: `${String(config.public.siteUrl || 'http://localhost:3000').replace(/\/+$/u, '')}/tags/${slug.value}`
    }
  ]
}))
</script>

<template>
  <div class="app-container app-section">
    <AppLoadingState
      v-if="pending"
      title="正在加载标签页"
      description="正在读取标签详情和相关文章列表"
    />

    <template v-else-if="tag">
      <AppSectionHeading
        eyebrow="标签归档"
        :title="tag.name"
        :description="`所有带有 ${tag.name} 标签的已发布文章都会汇总在这里`"
      />

      <div class="mt-8 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <AppSurface class="space-y-4">
          <AppStatusPill tone="warning">标签</AppStatusPill>
          <h2 class="panel-title">{{ tag.name }}</h2>
          <p class="body-copy">
            适合在多篇文章之间追踪同一个技术点、工具链或实现方案
          </p>
          <div class="flex flex-wrap gap-2">
            <AppStatusPill>{{ tag.articleCount }} 篇文章</AppStatusPill>
            <NuxtLink to="/topics" class="inline-flex items-center">
              <AppStatusPill tone="accent">查看专题</AppStatusPill>
            </NuxtLink>
          </div>
        </AppSurface>

        <div class="grid gap-5">
          <AppSurface
            v-for="article in articles"
            :key="article.id"
            class="grid gap-5 md:grid-cols-[1fr_auto]"
          >
            <div class="space-y-3">
              <div class="flex flex-wrap gap-2">
                <NuxtLink v-if="article.topic" :to="`/topics/${article.topic.slug}`">
                  <AppStatusPill tone="accent">{{ article.topic.name }}</AppStatusPill>
                </NuxtLink>
                <AppStatusPill>{{ article.readingTime }} 分钟</AppStatusPill>
                <AppStatusPill>
                  {{ formatDisplayDate(article.publishedAt) }}
                </AppStatusPill>
              </div>
              <div class="space-y-2">
                <h3 class="panel-title">{{ article.title }}</h3>
                <p class="body-copy">{{ article.summary }}</p>
              </div>
            </div>

            <div class="flex items-center">
              <NuxtLink
                :to="`/articles/${article.slug}`"
                class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
              >
                阅读文章
              </NuxtLink>
            </div>
          </AppSurface>

          <AppEmptyState
            v-if="articles.length === 0"
            :title="`${tag.name} 暂时还没有相关文章`"
            :description="`请先在后台发布带有 ${tag.name} 标签的文章`"
          />
        </div>
      </div>
    </template>

    <AppEmptyState
      v-else
      title="标签暂不可用"
      description="当前标签无法加载，请返回标签列表后重试"
    />
  </div>
</template>
