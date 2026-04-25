<script setup lang="ts">
import type { ProjectEditorPayload } from '~/types/content-studio'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

useSeoMeta({
  title: '新建项目',
  description: '在后台创建新的项目案例'
})

const submitting = ref(false)
const actionError = ref('')

const handleCreate = async (payload: ProjectEditorPayload) => {
  submitting.value = true
  actionError.value = ''

  try {
    const project = await $fetch<{ id: string }>('/api/admin/projects', {
      method: 'POST',
      body: payload
    })
    await navigateTo(`/admin/projects/${project.id}`)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '创建项目失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <AppSurface class="space-y-5">
      <AdminPageHeader
        eyebrow="新建项目"
        title="录入新的项目案例"
        description="先补齐项目摘要、技术栈和链接，再完善案例正文，前台项目区会自动同步展示"
      />
      <p v-if="actionError" class="text-sm text-danger" aria-live="polite">{{ actionError }}</p>
    </AppSurface>

    <AdminProjectForm
      mode="create"
      :submitting="submitting"
      @submit="handleCreate"
    />
  </div>
</template>
