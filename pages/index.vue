<script setup lang="ts">
import { ArrowRight, BookOpen, BrainCircuit, FolderKanban, Layers3 } from 'lucide-vue-next'
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
} = await useFetch<HomePageResponse>('/api/home', {
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
    title: '前端内容主线',
    detail: '围绕 Vue 3、TypeScript、HTML、CSS、ES6、组件协作、布局策略与工程化持续沉淀',
    tags: ['Vue 3', 'TypeScript', 'HTML', 'CSS']
  },
  {
    title: '后端与部署链路',
    detail: '补齐接口设计、数据库建模、权限校验、对象存储、部署配置与运行状态检查',
    tags: ['Node', '数据库', '权限', '部署']
  },
  {
    title: '浏览器与计算机基础',
    detail: '把渲染流程、缓存策略、网络请求、性能排查与计算机基础整理成可检索的知识结构',
    tags: ['浏览器', '网络', '缓存', '性能']
  },
  {
    title: 'GitHub 与项目履历',
    detail: '逐步补入源码仓库、项目截图、功能拆解、技术选型与上线复盘，形成完整作品集',
    tags: ['GitHub', '项目案例', '复盘', '作品集']
  }
]
</script>

<template>
  <div>
    <AppLoadingState
      v-if="pending"
      class="app-container app-section"
      title="正在加载首页内容"
      description="首页正在从公共内容接口获取最新文章、项目和专题数据"
    />

    <AppErrorState
      v-else-if="error"
      class="app-container app-section"
      title="首页加载失败"
      :description="homeErrorMessage"
      @action="refresh"
    />

    <template v-else>
      <section class="app-container py-4 md:py-6">
        <div class="grid min-h-[calc(100svh-7rem)] gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AppSurface class="hero-surface flex h-full flex-col justify-between overflow-hidden">
            <div class="hero-stack space-y-7">
              <div class="space-y-3.5">
                <AppStatusPill tone="accent">中文技术内容平台</AppStatusPill>
                <div class="space-y-3.5">
                  <p class="eyebrow">前端 / 计算机 / AI</p>
                  <h1 class="max-w-4xl hero-title">
                    {{ appConfig.site.headline }}
                  </h1>
                  <p class="max-w-3xl body-copy single-line-lg">
                    聚合 Vue 3、TypeScript、HTML、CSS、ES6、浏览器、网络、计算机基础与 AI 内容，前后台共用一条内容数据链路
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row">
                <NuxtLink
                  to="/articles"
                  class="inline-flex items-center justify-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
                >
                  浏览文章归档
                  <ArrowRight class="size-4" />
                </NuxtLink>
                <NuxtLink
                  to="/topics"
                  class="inline-flex items-center justify-center gap-2 rounded-full border border-line/[0.15] bg-surface-muted/60 px-5 py-3 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
                >
                  查看专题导航
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
                首页内容聚焦
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

              <div v-if="data.aiArticles[0]" class="space-y-3 rounded-3xl border border-line/10 bg-surface-muted/45 p-5">
                <div class="flex items-center gap-3">
                  <BrainCircuit class="size-4 text-accent" />
                  <p class="text-sm font-medium text-ink-strong">AI 相关文章</p>
                </div>
                <h2 class="panel-title">{{ data.aiArticles[0].title }}</h2>
                <p class="body-copy">{{ data.aiArticles[0].summary }}</p>
                <NuxtLink
                  to="/labs"
                  class="inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-warm"
                >
                  查看 AI 专区
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
          title="后台创建、数据库存储、前台展示，保持一致的数据链路"
          description="后台录入后统一进入内容源，首页、专题、项目与搜索页同步读取"
          title-class="single-line-lg"
          description-class="single-line-lg"
        />

        <div class="mt-8 grid gap-5 lg:grid-cols-3">
          <AppSurface class="space-y-4">
            <AppStatusPill tone="accent">步骤一</AppStatusPill>
            <h3 class="panel-title single-line-md">后台创建</h3>
            <p class="body-copy">
              在后台维护文章、专题、标签和项目，并控制草稿、审核与发布状态
            </p>
          </AppSurface>

          <AppSurface class="space-y-4">
            <AppStatusPill tone="accent">步骤二</AppStatusPill>
            <h3 class="panel-title single-line-md">数据库入库</h3>
            <p class="body-copy">
              生产环境以数据库为主数据源，避免首页、列表页和后台出现数据偏差
            </p>
          </AppSurface>

          <AppSurface class="space-y-4">
            <AppStatusPill tone="accent">步骤三</AppStatusPill>
            <h3 class="panel-title single-line-md">前台展示</h3>
            <p class="body-copy">
              首页、专题页、标签页、项目页和搜索页读取同一套公共接口，保证展示一致
            </p>
          </AppSurface>
        </div>
      </section>

      <section class="app-container app-section">
        <AppSectionHeading
          eyebrow="站点介绍"
          title="把前端、后端、基础知识与作品集整理成持续更新的中文技术站点"
          description="首页之外还会继续扩充专题、项目履历、GitHub 作品集与 AI 阅读辅助，撑起完整的内容版面"
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
              title="沉淀可检索、可复用的技术内容"
              description="文章板块覆盖前端开发、浏览器网络知识、计算机基础与 AI 工具实践"
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
              description="请先在后台创建并发布文章，首页会自动同步展示"
            />
          </AppSurface>

          <div class="grid gap-6">
            <AppSurface class="space-y-4">
              <div class="flex items-center gap-3">
                <Layers3 class="size-5 text-accent" />
                <h3 class="panel-title">热门专题</h3>
              </div>
              <div v-if="data.topics.length" class="flex flex-wrap gap-2">
                <NuxtLink v-for="topic in data.topics" :key="topic.id" :to="`/topics/${topic.slug}`">
                  <AppStatusPill tone="accent">{{ topic.name }}</AppStatusPill>
                </NuxtLink>
              </div>
              <p class="body-copy">
                通过专题快速进入 Vue 3、HTML、CSS、JavaScript、浏览器、网络、计算机基础和 AI 内容
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
    </template>
  </div>
</template>
