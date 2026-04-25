<script setup lang="ts">
import type { PublicTopicPagePayload } from '~/types/public-discovery'
import { formatDisplayDate } from '~/utils/display'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug || ''))

const { data, pending, error } = await useFetch<PublicTopicPagePayload>(() => `/api/topics/${slug.value}`, {
  watch: [slug]
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || '专题不存在'
  })
}

const topic = computed(() => data.value?.topic || null)
const articles = computed(() => data.value?.articles || [])

useSeoMeta({
  title: () => (topic.value ? `${topic.value.name} 专题` : '专题'),
  description: () =>
    topic.value?.description ||
    `查看 ${topic.value?.name || '当前专题'} 下已发布的技术文章`
})

useHead(() => ({
  link: [
    {
      rel: 'canonical',
      href: `${String(config.public.siteUrl || 'http://localhost:3000').replace(/\/+$/u, '')}/topics/${slug.value}`
    }
  ]
}))
</script>

<template>
  <div class="app-container app-section">
    <AppLoadingState
      v-if="pending"
      title="正在加载专题页"
      description="正在读取专题详情和相关文章列表"
    />

    <template v-else-if="topic">
      <AppSectionHeading
        eyebrow="专题归档"
        :title="topic.name"
        :description="topic.description || `${topic.name} 相关的已发布文章会集中展示在这里`"
      />

      <div class="mt-8 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <AppSurface class="space-y-4">
          <AppStatusPill tone="accent">专题</AppStatusPill>
          <h2 class="panel-title">{{ topic.name }}</h2>
          <p class="body-copy">
            {{ topic.description || '这个专题会把相关技术文章组织成连续的阅读路径' }}
          </p>
          <div class="flex flex-wrap gap-2">
            <AppStatusPill>{{ topic.articleCount }} 篇文章</AppStatusPill>
            <NuxtLink to="/tags" class="inline-flex items-center">
              <AppStatusPill>查看标签</AppStatusPill>
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
                <AppStatusPill>{{ article.readingTime }} 分钟</AppStatusPill>
                <AppStatusPill>
                  {{ formatDisplayDate(article.publishedAt) }}
                </AppStatusPill>
              </div>
              <div class="space-y-2">
                <h3 class="panel-title">{{ article.title }}</h3>
                <p class="body-copy">{{ article.summary }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <NuxtLink v-for="tag in article.tags" :key="tag.id" :to="`/tags/${tag.slug}`">
                  <AppStatusPill>{{ tag.name }}</AppStatusPill>
                </NuxtLink>
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
            :title="`${topic.name} 暂时还没有文章`"
            :description="`请先在后台发布归属到 ${topic.name} 的文章`"
          />
        </div>
      </div>
    </template>

    <AppEmptyState
      v-else
      title="专题暂不可用"
      description="当前专题无法加载，请返回专题列表后重试"
    />
  </div>
</template>
