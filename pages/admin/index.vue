<script setup lang="ts">
import { FolderKanban } from 'lucide-vue-next'
import type { DashboardResponse } from '~/types/content-studio'
import type { TelemetrySummaryResponse } from '~/types/telemetry'
import { getFetchStatusMessage } from '~/utils/fetch-error'
import {
  formatDisplayDateTime,
  getArticleStatusLabel,
  getProjectStatusLabel
} from '~/utils/display'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

useSeoMeta({
  title: '后台总览',
  description: '查看内容后台的统计概览、近期更新和基础运行状态'
})

const {
  data: bootstrap,
  refresh: refreshBootstrap
} = await useFetch('/api/system/status')
const {
  data: dashboard,
  pending: dashboardPending,
  error: dashboardError,
  refresh: refreshDashboard
} = await useFetch<DashboardResponse>('/api/admin/dashboard')
const {
  data: telemetry,
  pending: telemetryPending,
  error: telemetryError,
  refresh: refreshTelemetry
} = await useFetch<TelemetrySummaryResponse>('/api/admin/telemetry/summary')

const dashboardErrorMessage = computed(() => {
  return getFetchStatusMessage(dashboardError.value) || '后台概览暂时无法加载'
})

const telemetryErrorMessage = computed(() => {
  return getFetchStatusMessage(telemetryError.value) || '运营统计暂时无法加载'
})

const refreshOverview = async () => {
  await Promise.all([refreshBootstrap(), refreshDashboard(), refreshTelemetry()])
}

const stats = computed(() => [
  {
    label: '文章总数',
    value: String(dashboard.value?.stats.totalArticles || 0),
    tone: 'accent' as const
  },
  {
    label: '草稿',
    value: String(dashboard.value?.stats.draftArticles || 0),
    tone: 'warning' as const
  },
  {
    label: '已发布',
    value: String(dashboard.value?.stats.publishedArticles || 0),
    tone: 'success' as const
  },
  {
    label: '项目',
    value: String(dashboard.value?.stats.projectCount || 0),
    tone: 'neutral' as const
  },
  {
    label: '专题',
    value: String(dashboard.value?.stats.topicCount || 0),
    tone: 'accent' as const
  },
  {
    label: '标签',
    value: String(dashboard.value?.stats.tagCount || 0),
    tone: 'warning' as const
  }
])

const telemetryStats = computed(() => [
  {
    label: '近 7 天访问',
    value: String(telemetry.value?.pageVisitsLast7Days ?? 0)
  },
  {
    label: '近 7 天搜索',
    value: String(telemetry.value?.searchesLast7Days ?? 0)
  },
  {
    label: '近 7 天 AI 请求',
    value: String(telemetry.value?.aiRequestsLast7Days ?? 0)
  }
])

const telemetryProviderLabel = computed(() => {
  if (!telemetry.value) {
    return '不可用'
  }

  if (telemetry.value.provider === 'database') {
    return '数据库'
  }

  return telemetry.value.configured ? '本地缓存' : '本地回退'
})
</script>

<template>
  <div class="space-y-6">
    <AppLoadingState
      v-if="dashboardPending"
      title="正在加载后台概览"
      description="正在读取文章、项目、专题、标签与服务状态数据"
    />

    <AppErrorState
      v-else-if="dashboardError"
      title="后台概览不可用"
      :description="dashboardErrorMessage"
      @action="refreshOverview"
    />

    <template v-else>
      <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AppSurface v-for="item in stats" :key="item.label" class="space-y-3">
          <AppStatusPill :tone="item.tone">{{ item.label }}</AppStatusPill>
          <p class="text-3xl font-semibold tracking-tight md:text-[2.35rem]">{{ item.value }}</p>
        </AppSurface>
      </div>

      <div id="drafts" class="grid gap-6 2xl:grid-cols-[1fr_1fr_0.9fr]">
        <AppSurface class="min-w-0 space-y-5 overflow-hidden">
          <AppSectionHeading
            eyebrow="文章动态"
            title="最近文章"
            description="后台更新后，这里会同步显示最新文章状态"
            title-class="md:whitespace-nowrap"
            description-class="lg:whitespace-nowrap"
          />
          <div class="panel-scroll grid max-h-[31rem] gap-4">
            <div
              v-for="article in dashboard?.recentArticles || []"
              :key="article.id"
              class="min-w-0 overflow-hidden rounded-3xl border border-line/10 bg-surface-muted/50 p-5"
            >
              <div class="flex flex-wrap items-center gap-2">
                <AppStatusPill
                  :tone="article.status === 'PUBLISHED' ? 'success' : article.status === 'REVIEW' ? 'warning' : 'accent'"
                >
                  {{ getArticleStatusLabel(article.status) }}
                </AppStatusPill>
                <AppStatusPill>{{ article.topic?.name || '未分配专题' }}</AppStatusPill>
              </div>
              <h2 class="mt-4 panel-title single-line-md">{{ article.title }}</h2>
              <p class="mt-2 body-copy">{{ article.summary }}</p>
            </div>
          </div>
        </AppSurface>

        <AppSurface class="min-w-0 space-y-5 overflow-hidden">
          <AppSectionHeading
            eyebrow="项目案例"
            title="最近项目"
            description="项目录入后会自动同步到前台项目区"
            title-class="md:whitespace-nowrap"
            description-class="lg:whitespace-nowrap"
          />
          <div class="panel-scroll grid max-h-[31rem] gap-4">
            <div
              v-for="project in dashboard?.recentProjects || []"
              :key="project.id"
              class="min-w-0 overflow-hidden rounded-3xl border border-line/10 bg-surface-muted/50 p-5"
            >
              <div class="flex flex-wrap items-center gap-2">
                <AppStatusPill
                  :tone="project.status === 'LIVE' ? 'success' : project.status === 'BUILDING' ? 'warning' : 'neutral'"
                >
                  {{ getProjectStatusLabel(project.status) }}
                </AppStatusPill>
                <AppStatusPill v-if="project.isFeatured" tone="accent">精选项目</AppStatusPill>
              </div>
              <div class="mt-4 flex min-w-0 items-center gap-3">
                <FolderKanban class="size-5 text-accent" />
                <h2 class="panel-title single-line-md">{{ project.title }}</h2>
              </div>
              <p class="mt-2 body-copy">{{ project.summary }}</p>
            </div>
          </div>
        </AppSurface>

        <AppSurface id="ai-ops" class="min-w-0 space-y-5 overflow-hidden">
          <AppSectionHeading
            eyebrow="系统状态"
            title="服务配置"
            description="快速确认数据库、对象存储、AI 与后台环境是否就绪"
            title-class="md:whitespace-nowrap"
            description-class="lg:whitespace-nowrap"
          />
          <div class="panel-scroll grid max-h-[31rem] gap-3">
            <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">数据库</p>
              <p class="mt-2 body-copy">
                配置状态：
                <span class="font-medium text-ink-strong">
                  {{ bootstrap?.services.database ? '已配置' : '未配置' }}
                </span>
              </p>
            </div>
            <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">Supabase 公共环境</p>
              <p class="mt-2 body-copy">
                配置状态：
                <span class="font-medium text-ink-strong">
                  {{ bootstrap?.services.supabasePublic ? '已配置' : '未配置' }}
                </span>
              </p>
            </div>
            <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">对象存储桶</p>
              <p class="mt-2 body-copy">
                配置状态：
                <span class="font-medium text-ink-strong">
                  {{ bootstrap?.services.supabaseStorage ? '已配置' : '未配置' }}
                </span>
              </p>
            </div>
            <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">Longcat 服务密钥</p>
              <p class="mt-2 body-copy">
                配置状态：
                <span class="font-medium text-ink-strong">
                  {{ bootstrap?.services.longcat ? '已配置' : '未配置' }}
                </span>
              </p>
            </div>
            <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">后台登录环境</p>
              <p class="mt-2 body-copy">
                配置状态：
                <span class="font-medium text-ink-strong">
                  {{ bootstrap?.services.adminCredentials ? '已配置' : '未配置' }}
                </span>
              </p>
            </div>
          </div>
        </AppSurface>
      </div>

      <AppSurface class="space-y-5">
        <AppSectionHeading
          eyebrow="运营统计"
          title="站点使用信号"
          description="记录访问、搜索和 AI 交互，确认内容链路是否正常运行"
        />

        <AppLoadingState
          v-if="telemetryPending"
          title="正在加载运营统计"
          description="正在读取访问、搜索与 AI 请求记录"
        />

        <AppErrorState
          v-else-if="telemetryError"
          title="运营统计不可用"
          :description="telemetryErrorMessage"
          @action="refreshTelemetry"
        />

        <template v-else>
          <div class="grid gap-4 md:grid-cols-3">
            <div
              v-for="item in telemetryStats"
              :key="item.label"
              class="rounded-3xl border border-line/10 bg-surface-muted/50 p-5"
            >
              <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">{{ item.label }}</p>
              <p class="mt-3 text-2xl font-semibold tracking-tight md:text-[2rem]">{{ item.value }}</p>
            </div>
          </div>

          <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div class="min-w-0 space-y-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-medium text-ink-strong">热门搜索词</p>
                <AppStatusPill :tone="telemetry?.provider === 'database' ? 'success' : 'warning'">
                  {{ telemetryProviderLabel }}
                </AppStatusPill>
              </div>
              <div v-if="telemetry?.topQueries.length" class="panel-scroll grid max-h-[22rem] gap-3 pr-1">
                <div
                  v-for="item in telemetry.topQueries"
                  :key="item.query"
                  class="rounded-3xl border border-line/10 bg-surface-muted/50 px-4 py-3"
                >
                  <div class="flex min-w-0 items-center justify-between gap-3">
                    <p class="single-line min-w-0 text-sm text-ink-strong">{{ item.query }}</p>
                    <AppStatusPill>{{ item.count }} 次</AppStatusPill>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm leading-7 text-ink-soft">
                暂时还没有搜索记录，可以先到前台搜索页做几次真实查询
              </p>
            </div>

            <div class="min-w-0 space-y-4">
              <p class="text-sm font-medium text-ink-strong">最近 AI 事件</p>
              <div v-if="telemetry?.recentAiEvents.length" class="panel-scroll grid max-h-[22rem] gap-3 pr-1">
                <div
                  v-for="item in telemetry.recentAiEvents"
                  :key="item.id"
                  class="rounded-3xl border border-line/10 bg-surface-muted/50 px-4 py-3"
                >
                  <div class="flex flex-wrap items-center gap-2">
                    <AppStatusPill :tone="item.status === 'SUCCESS' ? 'success' : 'warning'">
                      {{ item.status === 'SUCCESS' ? '成功' : '异常' }}
                    </AppStatusPill>
                    <AppStatusPill>{{ item.feature }}</AppStatusPill>
                    <AppStatusPill v-if="item.articleSlug" tone="accent">{{ item.articleSlug }}</AppStatusPill>
                  </div>
                  <p class="mt-3 break-words text-sm text-ink-soft">
                    {{ item.model || '未记录模型信息' }}
                  </p>
                  <p class="mt-1 text-xs text-ink-faint">
                    {{ formatDisplayDateTime(item.createdAt) }}
                  </p>
                </div>
              </div>
              <p v-else class="text-sm leading-7 text-ink-soft">
                暂时还没有 AI 交互记录，可以到文章页试用摘要、划词解释或问答功能
              </p>
            </div>
          </div>
        </template>
      </AppSurface>
    </template>
  </div>
</template>
