<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import type { SearchResponse } from '~/types/content'
import { getSearchKindLabel } from '~/utils/display'
import { getFetchStatusMessage } from '~/utils/fetch-error'

useSeoMeta({
  title: '搜索',
  description: '按关键词检索文章、AI 内容和项目案例'
})

const route = useRoute()
const query = ref(String(route.query.q || ''))
const normalizedQuery = computed(() => query.value.trim())
const requestQuery = computed(() => ({
  q: normalizedQuery.value
}))

const {
  data: searchResponse,
  pending,
  error,
  refresh
} = await useFetch<SearchResponse>('/api/search', {
  query: requestQuery,
  watch: [requestQuery],
  default: () => ({
    query: '',
    total: 0,
    entries: []
  })
})

const filteredEntries = computed(() => searchResponse.value?.entries || [])
const resultCountLabel = computed(() => `共 ${searchResponse.value?.total || 0} 条结果`)

const searchErrorMessage = computed(() => {
  if (!error.value) {
    return ''
  }

  return getFetchStatusMessage(error.value) || '搜索服务暂时不可用'
})
</script>

<template>
  <div class="app-container app-section">
    <AppSectionHeading
      eyebrow="站内搜索"
      title="用一个入口检索文章、AI 内容和项目案例"
      description="搜索页会聚合已发布文章、公开项目和 AI 导航入口，便于快速定位内容"
      title-class="single-line-xl"
      description-class="single-line-xl"
    />

    <AppSurface class="mt-8 space-y-5">
      <label
        for="site-search-input"
        class="flex min-w-0 items-center gap-3 rounded-[1.75rem] border border-line/[0.15] bg-surface-muted/60 px-5 py-3.5"
      >
        <span class="sr-only">搜索已发布文章、AI 内容和项目案例</span>
        <Search class="size-5 text-accent" />
        <input
          id="site-search-input"
          v-model="query"
          type="text"
          placeholder="搜索文章、专题、项目"
          class="w-full bg-transparent text-base text-ink-strong outline-none placeholder:text-ink-faint"
          aria-describedby="site-search-hint"
        >
      </label>
      <p id="site-search-hint" class="body-copy single-line-lg">
        可按专题、技术关键词、项目名称或 AI 相关词汇进行检索
      </p>
      <div class="flex flex-wrap gap-2">
        <AppStatusPill>公共搜索接口</AppStatusPill>
        <AppStatusPill tone="accent">文章 + AI + 项目</AppStatusPill>
        <AppStatusPill>支持后续扩展语义检索</AppStatusPill>
        <AppStatusPill v-if="!searchErrorMessage">{{ resultCountLabel }}</AppStatusPill>
      </div>
    </AppSurface>

    <AppLoadingState
      v-if="pending"
      class="mt-6"
      title="正在搜索内容"
      description="正在按关键词匹配文章、AI 内容和项目案例"
    />

    <AppErrorState
      v-else-if="searchErrorMessage"
      class="mt-6"
      title="搜索暂不可用"
      :description="searchErrorMessage"
      @action="refresh"
    />

    <div v-else class="mt-6 grid gap-4" :aria-busy="pending ? 'true' : 'false'">
      <NuxtLink
        v-for="entry in filteredEntries"
        :key="entry.id"
        :to="entry.href"
        class="surface-frame block p-6 transition hover:border-accent/25 hover:bg-surface-muted/60"
      >
        <div class="flex flex-wrap items-center gap-2">
          <AppStatusPill>{{ getSearchKindLabel(entry.kind) }}</AppStatusPill>
          <span class="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
            {{ entry.meta }}
          </span>
        </div>
        <h2 class="mt-4 panel-title">{{ entry.title }}</h2>
        <p class="mt-2 max-w-3xl body-copy">
          {{ entry.description }}
        </p>
      </NuxtLink>
    </div>

    <AppEmptyState
      v-if="!pending && !searchErrorMessage && filteredEntries.length === 0"
      class="mt-6"
      title="没有匹配结果"
      description="可以尝试更宽泛的关键词，例如 Vue、JavaScript、浏览器、AI、项目"
    />
  </div>
</template>
