<script setup lang="ts">
import { FolderKanban, PencilLine, Plus, Trash2 } from 'lucide-vue-next'
import type { ProjectRecord } from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'
import {
  formatDisplayDateTime,
  getProjectStatusLabel
} from '~/utils/display'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

useSeoMeta({
  title: '后台项目',
  description: '管理项目案例、技术栈、仓库链接和上线状态'
})

const query = ref('')
const statusFilter = ref<'ALL' | ProjectRecord['status']>('ALL')

const {
  data: projects,
  pending,
  error,
  refresh
} = useLazyFetch<ProjectRecord[]>('/api/admin/projects', {
  default: () => []
})

const deletePendingId = ref('')
const actionError = ref('')

const fetchErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '项目列表暂时无法加载'
})

const filteredProjects = computed(() => {
  return (projects.value || []).filter((project) => {
    const matchesStatus = statusFilter.value === 'ALL' || project.status === statusFilter.value
    const normalizedQuery = query.value.trim().toLowerCase()
    const haystack = `${project.title} ${project.summary} ${project.slug} ${project.stack.join(' ')}`.toLowerCase()

    return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery))
  })
})

const handleDelete = async (project: ProjectRecord) => {
  const confirmed = confirm(`确认删除项目《${project.title}》吗？`)

  if (!confirmed) {
    return
  }

  deletePendingId.value = project.id
  actionError.value = ''

  try {
    await $fetch(`/api/admin/projects/${project.id}`, {
      method: 'DELETE'
    })
    projects.value = projects.value.filter((item) => item.id !== project.id)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '删除项目失败'
  } finally {
    deletePendingId.value = ''
  }
}

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
  <div class="space-y-6">
    <AppSurface class="space-y-5">
      <AdminPageHeader
        eyebrow="项目管理"
        title="把项目沉淀成可展示的案例"
        description="项目区用于承接 GitHub 仓库、技术栈、上线状态和案例说明，形成博客之外的实践展示层"
      >
        <NuxtLink
          to="/admin/projects/new"
          class="inline-flex items-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
        >
          <Plus class="size-4" />
          新建项目
        </NuxtLink>
      </AdminPageHeader>

      <div class="grid gap-4 xl:grid-cols-[1fr_180px]">
        <label class="grid gap-2">
          <span class="sr-only">搜索项目</span>
          <input
            v-model="query"
            type="text"
            class="w-full rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition placeholder:text-ink-faint focus:border-accent/40"
            placeholder="按项目名称、摘要、标识或技术栈搜索"
          >
        </label>
        <label class="grid gap-2">
          <span class="sr-only">按状态筛选项目</span>
          <select
            v-model="statusFilter"
            class="w-full rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition focus:border-accent/40"
          >
            <option value="ALL">全部状态</option>
            <option value="BUILDING">开发中</option>
            <option value="LIVE">已上线</option>
            <option value="ARCHIVED">已归档</option>
          </select>
        </label>
      </div>

      <p v-if="actionError" class="text-sm text-danger" aria-live="polite">{{ actionError }}</p>
    </AppSurface>

    <AppLoadingState
      v-if="pending"
      title="正在加载项目列表"
      description="正在读取项目案例、技术栈和状态信息"
    />

    <AppErrorState
      v-else-if="error"
      title="项目列表不可用"
      :description="fetchErrorMessage"
      @action="refresh"
    />

    <div v-else class="grid gap-4">
      <AppSurface
        v-for="project in filteredProjects"
        :key="project.id"
        class="grid gap-5 xl:grid-cols-[1fr_auto]"
      >
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <AppStatusPill :tone="toneForStatus(project.status)">
              {{ getProjectStatusLabel(project.status) }}
            </AppStatusPill>
            <AppStatusPill>{{ project.stack.length }} 项技术</AppStatusPill>
            <AppStatusPill v-if="project.isFeatured" tone="accent">精选项目</AppStatusPill>
          </div>
          <div>
            <div class="flex items-center gap-3">
              <FolderKanban class="size-5 text-accent" />
              <h2 class="text-2xl font-semibold tracking-tight">{{ project.title }}</h2>
            </div>
            <p class="mt-2 max-w-3xl text-sm leading-7 text-ink-soft md:text-base">
              {{ project.summary }}
            </p>
          </div>
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
        </div>

        <div class="flex flex-col gap-3 xl:items-end">
          <p class="text-sm text-ink-faint">
            更新于 {{ formatDisplayDateTime(project.updatedAt) }}
          </p>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              :to="`/admin/projects/${project.id}`"
              class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
            >
              <PencilLine class="size-4" />
              编辑
            </NuxtLink>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-danger/30 px-4 py-2 text-sm text-danger transition hover:bg-danger/10"
              :disabled="deletePendingId === project.id"
              @click="handleDelete(project)"
            >
              <Trash2 class="size-4" />
              {{ deletePendingId === project.id ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>
      </AppSurface>
    </div>

    <AppEmptyState
      v-if="!pending && !error && filteredProjects.length === 0"
      title="当前筛选条件下没有项目"
      description="可以放宽搜索条件、切换状态筛选，或直接新增第一个项目案例"
    />
  </div>
</template>
