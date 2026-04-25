<script setup lang="ts">
import { FolderKanban } from 'lucide-vue-next'
import type { ProjectRecord } from '~/types/content-studio'
import { getProjectStatusLabel } from '~/utils/display'
import { getFetchStatusMessage } from '~/utils/fetch-error'

useSeoMeta({
  title: '项目',
  description: '查看项目案例、仓库链接、上线状态与技术栈'
})

const {
  data: projects,
  pending,
  error,
  refresh
} = await useFetch<ProjectRecord[]>('/api/projects', {
  default: () => []
})

const projectsErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '项目案例暂时无法加载'
})

const toneForStatus = (status: ProjectRecord['status']) => {
  if (status === 'LIVE') {
    return 'success'
  }

  if (status === 'BUILDING') {
    return 'warning'
  }

  return 'neutral'
}
</script>

<template>
  <div class="app-container app-section">
    <AppSectionHeading
      eyebrow="项目案例"
      title="把个人项目沉淀成可展示、可检索、可继续维护的案例"
      description="项目板块承接 GitHub 仓库、技术栈、上线状态和案例说明，形成稳定的实践展示区"
      title-class="single-line-xl"
      description-class="single-line-xl"
    />

    <AppLoadingState
      v-if="pending"
      class="mt-8"
      title="正在加载项目案例"
      description="正在获取公开项目列表与案例信息"
    />

    <AppErrorState
      v-else-if="error"
      class="mt-8"
      title="项目案例暂不可用"
      :description="projectsErrorMessage"
      @action="refresh"
    />

    <div v-else-if="projects.length" class="mt-8 grid gap-5">
      <AppSurface v-for="project in projects" :id="project.slug" :key="project.id" class="space-y-5 scroll-mt-28">
        <div class="flex flex-wrap items-center gap-3">
          <FolderKanban class="size-5 text-accent" />
          <h2 class="panel-title single-line-lg">{{ project.title }}</h2>
          <AppStatusPill :tone="toneForStatus(project.status)">
            {{ getProjectStatusLabel(project.status) }}
          </AppStatusPill>
          <AppStatusPill v-if="project.isFeatured" tone="accent">精选项目</AppStatusPill>
        </div>
        <p class="max-w-3xl body-copy">
          {{ project.summary }}
        </p>
        <div class="flex flex-wrap gap-2">
          <AppStatusPill v-for="item in project.stack" :key="item">{{ item }}</AppStatusPill>
        </div>
        <div class="flex flex-wrap gap-4 text-sm text-ink-soft">
          <a
            v-if="project.repoUrl"
            :href="project.repoUrl"
            target="_blank"
            rel="noreferrer"
            class="transition hover:text-accent"
          >
            GitHub 仓库
          </a>
          <a
            v-if="project.demoUrl"
            :href="project.demoUrl"
            target="_blank"
            rel="noreferrer"
            class="transition hover:text-accent"
          >
            在线演示
          </a>
        </div>
      </AppSurface>
    </div>

    <AppEmptyState
      v-else
      class="mt-8"
      title="暂时还没有公开项目"
      description="请先在后台新增并发布项目案例，前台会自动同步展示"
    />
  </div>
</template>
