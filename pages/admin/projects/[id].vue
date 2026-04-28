<script setup lang="ts">
import type { ProjectEditorPayload, ProjectRecord } from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

const route = useRoute()
const projectId = computed(() => String(route.params.id || ''))

const {
  data: project,
  pending,
  error,
  refresh
} = useLazyFetch<ProjectRecord>(() => `/api/admin/projects/${projectId.value}`, {
  watch: [projectId]
})

useSeoMeta({
  title: project.value ? `编辑 ${project.value.title}` : '编辑项目',
  description: '编辑项目简介、技术栈、链接与案例正文'
})

const submitting = ref(false)
const actionError = ref('')

const projectErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '目标项目暂时无法读取'
})

const handleSave = async (payload: ProjectEditorPayload) => {
  submitting.value = true
  actionError.value = ''

  try {
    const updatedProject = await $fetch<ProjectRecord>(`/api/admin/projects/${projectId.value}`, {
      method: 'PATCH',
      body: payload
    })
    project.value = updatedProject
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '保存项目失败'
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!project.value) {
    return
  }

  const confirmed = confirm(`确认删除项目《${project.value.title}》吗？`)

  if (!confirmed) {
    return
  }

  actionError.value = ''

  try {
    await $fetch(`/api/admin/projects/${projectId.value}`, {
      method: 'DELETE'
    })

    await navigateTo('/admin/projects')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '删除项目失败'
  }
}

const publicProjectPath = computed(() => {
  if (!project.value) {
    return '/projects'
  }

  return project.value.status === 'LIVE' ? `/projects#${project.value.slug}` : '/projects'
})

const publicProjectLabel = computed(() => {
  if (!project.value) {
    return '返回前台项目页'
  }

  return project.value.status === 'LIVE' ? '查看前台项目' : '返回前台项目列表'
})
</script>

<template>
  <div class="space-y-6">
    <AppSurface class="space-y-5">
      <AdminPageHeader
        eyebrow="编辑项目"
        :title="project?.title || '正在加载项目...'"
        description="项目摘要、技术栈、仓库地址、演示链接和案例正文统一在这里维护"
      >
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            :to="publicProjectPath"
            class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
          >
            {{ publicProjectLabel }}
          </NuxtLink>
          <NuxtLink
            to="/admin/projects"
            class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
          >
            返回项目列表
          </NuxtLink>
        </div>
      </AdminPageHeader>
      <p v-if="actionError" class="text-sm text-danger" aria-live="polite">{{ actionError }}</p>
    </AppSurface>

    <AppLoadingState
      v-if="pending"
      title="正在加载项目编辑器"
      description="正在读取项目案例、技术栈和链接信息"
    />

    <AppErrorState
      v-else-if="error"
      title="项目编辑器不可用"
      :description="projectErrorMessage"
      @action="refresh"
    />

    <AdminProjectForm
      v-else-if="project"
      mode="edit"
      :project="project"
      :submitting="submitting"
      allow-delete
      @submit="handleSave"
      @delete="handleDelete"
    />

    <AppEmptyState
      v-else
      title="项目不存在"
      description="未找到对应项目，请返回项目列表后重新选择"
    />
  </div>
</template>
