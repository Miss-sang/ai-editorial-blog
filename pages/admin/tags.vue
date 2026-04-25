<script setup lang="ts">
import type { TagEditorPayload, TagRecord, TopicEditorPayload } from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

useSeoMeta({
  title: '后台标签',
  description: '管理检索标签、细粒度技术点和颜色标识'
})

const {
  data: tags,
  pending,
  error,
  refresh
} = await useFetch<TagRecord[]>('/api/admin/tags', {
  default: () => []
})

const fetchErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '标签列表暂时无法加载'
})

const creating = ref(false)
const savingId = ref('')
const deletingId = ref('')
const actionError = ref('')

const handleCreate = async (payload: TagEditorPayload) => {
  creating.value = true
  actionError.value = ''

  try {
    await $fetch('/api/admin/tags', {
      method: 'POST',
      body: payload
    })
    await refresh()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '创建标签失败'
  } finally {
    creating.value = false
  }
}

const handleUpdate = async (id: string, payload: TagEditorPayload) => {
  savingId.value = id
  actionError.value = ''

  try {
    await $fetch(`/api/admin/tags/${id}`, {
      method: 'PATCH',
      body: payload
    })
    await refresh()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '更新标签失败'
  } finally {
    savingId.value = ''
  }
}

const handleDelete = async (id: string) => {
  const target = (tags.value || []).find((item) => item.id === id)

  if (!target || !confirm(`确认删除标签《${target.name}》吗？`)) {
    return
  }

  deletingId.value = id
  actionError.value = ''

  try {
    await $fetch(`/api/admin/tags/${id}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '删除标签失败'
  } finally {
    deletingId.value = ''
  }
}

const handleManagerCreate = (payload: TopicEditorPayload | TagEditorPayload) =>
  handleCreate(payload as TagEditorPayload)

const handleManagerUpdate = (
  id: string,
  payload: TopicEditorPayload | TagEditorPayload
) => handleUpdate(id, payload as TagEditorPayload)
</script>

<template>
  <div class="space-y-6">
    <AppSurface class="space-y-5">
      <AdminPageHeader
        eyebrow="标签管理"
        title="补充细粒度技术检索点"
        description="标签用于承接更细的技术概念、工具名和实现主题，服务搜索、筛选和后续 AI 推荐"
      />
      <p v-if="actionError" class="text-sm text-danger" aria-live="polite">{{ actionError }}</p>
    </AppSurface>

    <AppLoadingState
      v-if="pending"
      title="正在加载标签管理"
      description="正在读取标签列表和文章关联数量"
    />

    <AppErrorState
      v-else-if="error"
      title="标签管理不可用"
      :description="fetchErrorMessage"
      @action="refresh"
    />

    <AdminTaxonomyManager
      v-else
      kind="tag"
      :items="tags"
      :creating="creating"
      :saving-id="savingId"
      :deleting-id="deletingId"
      @create="handleManagerCreate"
      @update="handleManagerUpdate"
      @delete="handleDelete"
    />
  </div>
</template>
