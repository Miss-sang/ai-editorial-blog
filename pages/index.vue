<script setup lang="ts">
import { ArrowRight, BookOpen, FolderKanban, Layers3, Search } from 'lucide-vue-next'
import type { HomePageResponse } from '~/types/home-page'
import { formatDisplayDate } from '~/utils/display'
import { getFetchStatusMessage } from '~/utils/fetch-error'

const appConfig = useAppConfig()

useSeoMeta({
  title: '首页',
  description: appConfig.site.description
})

const {
  data,
  pending,
  error,
  refresh
} = useLazyFetch<HomePageResponse>('/api/home', {
  default: () => ({
    metrics: [],
    featuredArticle: null,
    latestArticles: [],
    featuredProject: null,
    latestProjects: [],
    topics: [],
    aiArticles: []
  })
})

const featuredArticle = computed(() => data.value.featuredArticle)
const featuredProject = computed(() => data.value.featuredProject)
const homeErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '首页内容暂时无法加载'
})

const siteTracks = [
  {
    title: '前端',
    detail: '记录界面实现、组件组织、浏览器问题与性能优化。',
    tags: ['前端']
  },
  {
    title: '后端',
    detail: '记录接口设计、数据建模、权限校验、部署和内容管理链路。',
    tags: ['后端']
  }
]

const topicDescriptionByName: Record<string, string> = {
  'Vue 3 与 TypeScript': '组件、组合式 API、类型约束与工程实践。',
  'HTML 与 CSS': '语义化结构、响应式布局与可访问性。',
  'JavaScript / ES6+': '语言特性、异步流程与常见工程写法。',
  浏览器原理: '渲染流程、缓存机制与性能排查。',
  计算机网络: 'HTTP、缓存、跨域与网络请求排查。',
  计算机基础: '进程、线程、内存与前端工程基础。',
  'AI 平台与工具': '模型平台、提示词和阅读辅助实践。'
}

const getTopicDescription = (topic: HomePageResponse['topics'][number]) => {
  return topic.description || topicDescriptionByName[topic.name] || '收纳这一类文章和实践记录。'
}
</script>

<template>
  <div>
    <AppErrorState
      v-if="error"
      class="app-container app-section"
      title="首页加载失败"
      :description="homeErrorMessage"
      @action="refresh"
    />

    <section class="app-container py-4 md:py-6" :aria-busy="pending ? 'true' : 'false'">
        <div class="grid min-h-[calc(100svh-7rem)] gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AppSurface class="hero-surface flex h-full flex-col justify-between overflow-hidden">
            <div class="hero-stack space-y-7">
              <div class="space-y-3.5">
                <AppStatusPill tone="accent">个人中文技术博客</AppStatusPill>
                <div class="space-y-3.5">
                  <p class="eyebrow">前端 / 后端</p>
                  <h1 class="max-w-4xl hero-title">
                    {{ appConfig.site.headline }}
                  </h1>
                  <p class="max-w-3xl body-copy single-line-lg">
                    记录开发中的问题、实现过程和项目复盘。
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row">
                <NuxtLink
                  to="/articles"
                  class="inline-flex items-center justify-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
                >
                  阅读文章
                  <ArrowRight class="size-4" />
                </NuxtLink>
                <NuxtLink
                  to="/topics"
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-line/[0.15] bg-surface-muted/60 px-5 py-3 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
                >
                  浏览专题
                </NuxtLink>
              </div>
            </div>

            <div class="mt-9 grid gap-3 md:grid-cols-3">
              <div
                v-for="metric in data.metrics"
                :key="metric.label"
                class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4"
              >
                <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-faint">
                  {{ metric.label }}
                </p>
                <p class="mt-3 text-2xl font-semibold text-ink-strong">{{ metric.value }}</p>
                <p class="mt-2 text-sm leading-6 text-ink-soft">{{ metric.detail }}</p>
              </div>
            </div>
          </AppSurface>

          <AppSurface class="flex h-full flex-col overflow-hidden border border-accent/10">
            <div class="border-b border-line/10 px-5 py-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.26em] text-accent">
                首页焦点
              </p>
            </div>
            <div class="grid flex-1 content-start gap-5 px-5 py-6">
              <div v-if="featuredArticle" class="space-y-3 rounded-3xl border border-line/10 bg-surface-muted/45 p-5">
                <div class="flex items-center gap-3">
                  <BookOpen class="size-4 text-accent" />
                  <p class="text-sm font-medium text-ink-strong">推荐文章</p>
                </div>
                <h2 class="panel-title">{{ featuredArticle.title }}</h2>
                <p class="body-copy">{{ featuredArticle.summary }}</p>
                <NuxtLink
                  :to="`/articles/${featuredArticle.slug}`"
                  class="inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-warm"
                >
                  进入文章
                  <ArrowRight class="size-4" />
                </NuxtLink>
              </div>

              <div class="space-y-3 rounded-3xl border border-line/10 bg-surface-muted/45 p-5">
                <div class="flex items-center gap-3">
                  <Search class="size-4 text-accent" />
                  <p class="text-sm font-medium text-ink-strong">站内搜索</p>
                </div>
                <h2 class="panel-title">快速找到文章、专题和项目</h2>
                <p class="body-copy">按关键词检索标题、专题、标签和项目名称。</p>
                <NuxtLink
                  to="/search"
                  class="inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-warm"
                >
                  打开搜索
                  <ArrowRight class="size-4" />
                </NuxtLink>
              </div>

              <div v-if="featuredProject" class="space-y-3 rounded-3xl border border-line/10 bg-surface-muted/45 p-5">
                <div class="flex items-center gap-3">
                  <FolderKanban class="size-4 text-accent" />
                  <p class="text-sm font-medium text-ink-strong">精选项目</p>
                </div>
                <h2 class="panel-title">{{ featuredProject.title }}</h2>
                <p class="body-copy">{{ featuredProject.summary }}</p>
                <NuxtLink
                  to="/projects"
                  class="inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-warm"
                >
                  查看项目案例
                  <ArrowRight class="size-4" />
                </NuxtLink>
              </div>
            </div>
          </AppSurface>
        </div>
      </section>

      <section class="app-container app-section">
        <AppSectionHeading
          eyebrow="平台主流程"
          title="后台写入，前台同步展示"
          description="文章、专题、项目共用同一套内容数据。"
          title-class="single-line-lg"
          description-class="single-line-lg"
        />

        <div class="mt-8 grid gap-5 lg:grid-cols-3">
          <AppSurface class="space-y-4">
            <AppStatusPill tone="accent">步骤一</AppStatusPill>
            <h3 class="panel-title single-line-md">内容创建</h3>
            <p class="body-copy">
              维护文章、专题、标签和项目。
            </p>
          </AppSurface>

          <AppSurface class="space-y-4">
            <AppStatusPill tone="accent">步骤二</AppStatusPill>
            <h3 class="panel-title single-line-md">统一入库</h3>
            <p class="body-copy">
              发布内容写入数据库或本地内容源。
            </p>
          </AppSurface>

          <AppSurface class="space-y-4">
            <AppStatusPill tone="accent">步骤三</AppStatusPill>
            <h3 class="panel-title single-line-md">前台展示</h3>
            <p class="body-copy">
              首页、专题、项目和搜索同步读取。
            </p>
          </AppSurface>
        </div>
      </section>

      <section class="app-container app-section">
        <AppSectionHeading
          eyebrow="站点介绍"
          title="这里是我的个人技术博客"
          description="主要记录前端、后端开发中的问题、实现过程和项目复盘。"
          title-class="single-line-xl"
          description-class="single-line-xl"
        />

        <div class="mt-8 grid gap-5 xl:grid-cols-2">
          <AppSurface
            v-for="track in siteTracks"
            :key="track.title"
            class="space-y-4"
          >
            <h3 class="panel-title single-line-md">{{ track.title }}</h3>
            <p class="body-copy">
              {{ track.detail }}
            </p>
            <div class="flex flex-wrap gap-2">
              <AppStatusPill v-for="tag in track.tags" :key="tag">{{ tag }}</AppStatusPill>
            </div>
          </AppSurface>
        </div>
      </section>

      <section class="app-container app-section">
        <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <AppSurface class="space-y-6">
            <AppSectionHeading
              eyebrow="最新文章"
              title="最新技术文章"
              description="按时间展示最近发布的文章。"
              title-class="single-line-xl"
              description-class="single-line-xl"
            />

            <div v-if="data.latestArticles.length" class="grid gap-4">
              <div
                v-for="article in data.latestArticles"
                :key="article.id"
                class="rounded-3xl border border-line/10 bg-surface-muted/45 p-5"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <AppStatusPill v-if="article.topic">{{ article.topic.name }}</AppStatusPill>
                  <AppStatusPill>{{ formatDisplayDate(article.publishedAt) }}</AppStatusPill>
                </div>
                <h3 class="mt-4 panel-title">{{ article.title }}</h3>
                <p class="mt-2 body-copy">{{ article.summary }}</p>
              </div>
            </div>

            <AppEmptyState
              v-else
              title="暂时还没有已发布文章"
              description="发布文章后会自动显示在这里。"
            />
          </AppSurface>

          <div class="grid gap-6">
            <AppSurface class="space-y-4">
              <div class="flex items-center gap-3">
                <Layers3 class="size-5 text-accent" />
                <h3 class="panel-title">专题栏目</h3>
              </div>
              <div v-if="data.topics.length" class="divide-y divide-line/10">
                <NuxtLink
                  v-for="topic in data.topics"
                  :key="topic.id"
                  :to="`/topics/${topic.slug}`"
                  class="block py-3 first:pt-0 last:pb-0"
                >
                  <div class="flex items-center justify-between gap-3">
                    <h4 class="text-sm font-semibold text-ink-strong">{{ topic.name }}</h4>
                    <span class="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                      {{ topic.articleCount }} 篇
                    </span>
                  </div>
                  <p class="mt-1 body-copy">{{ getTopicDescription(topic) }}</p>
                </NuxtLink>
              </div>
              <p v-else class="body-copy">暂无公开专题。</p>
              <p class="body-copy">
                专题按文章分类组织，便于连续阅读。
              </p>
            </AppSurface>

            <AppSurface class="space-y-4">
              <p class="eyebrow">项目案例</p>
              <div v-if="data.latestProjects.length" class="grid gap-4">
                <div
                  v-for="project in data.latestProjects"
                  :key="project.id"
                  class="rounded-3xl border border-line/10 bg-surface-muted/45 p-5"
                >
                  <h3 class="panel-title-sm">{{ project.title }}</h3>
                  <p class="mt-2 body-copy">{{ project.summary }}</p>
                </div>
              </div>
              <AppEmptyState
                v-else
                title="项目板块暂未上线"
                description="请先在后台新增项目案例，前台会自动同步项目内容"
              />
            </AppSurface>
          </div>
        </div>
    </section>
  </div>
</template>
