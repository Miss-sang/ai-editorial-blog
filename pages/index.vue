<script setup lang="ts">
import type { HomePageResponse } from '~/types/home-page'
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

const homeErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '首页内容暂时无法加载'
})
</script>

<template>
  <div class="blog-page" :aria-busy="pending ? 'true' : 'false'">
    <AppErrorState
      v-if="error"
      class="app-container app-section"
      title="首页加载失败"
      :description="homeErrorMessage"
      @action="refresh"
    />

    <div v-else class="blog-shell">
      <HomeIntro />

      <div class="blog-layout">
        <HomeArticleList
          :articles="data.latestArticles"
        />
        <LazyHomeSidebar
          :ai-articles="data.aiArticles"
          :topics="data.topics"
        />
      </div>

      <LazyHomeProjectNotes
        :projects="data.latestProjects"
        :ai-articles="data.aiArticles"
      />
    </div>
  </div>
</template>
