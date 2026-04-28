<script setup lang="ts">
import type { TagEditorPayload, TopicEditorPayload, TopicRecord } from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

useSeoMeta({
  title: '后台专题',
  description: '管理博客的主知识结构和专题导航'
})

const {
  data: topics,
  pending,
  error,
  refresh
} = useLazyFetch<TopicRecord[]>('/api/admin/topics', {
  default: () => []
})

const fetchErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '专题列表暂时无法加载'
})

const creating = ref(false)
const savingId = ref('')
const deletingId = ref('')
const actionError = ref('')

const sortTopics = (items: TopicRecord[]) =>
  items.slice().sort((left, right) => left.name.localeCompare(right.name))

const handleCreate = async (payload: TopicEditorPayload) => {
  creating.value = true
  actionError.value = ''

  try {
    const topic = await $fetch<TopicRecord>('/api/admin/topics', {
      method: 'POST',
      body: payload
    })
    topics.value = sortTopics([...(topics.value || []), topic])
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '创建专题失败'
  } finally {
    creating.value = false
  }
}

const handleUpdate = async (id: string, payload: TopicEditorPayload) => {
  savingId.value = id
  actionError.value = ''

  try {
    const topic = await $fetch<TopicRecord>(`/api/admin/topics/${id}`, {
      method: 'PATCH',
      body: payload
    })
    topics.value = sortTopics(
      (topics.value || []).map((item) => (item.id === id ? topic : item))
    )
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '更新专题失败'
  } finally {
    savingId.value = ''
  }
}

const handleDelete = async (id: string) => {
  const target = (topics.value || []).find((item) => item.id === id)

  if (!target || !confirm(`确认删除专题《${target.name}》吗？`)) {
    return
  }

  deletingId.value = id
  actionError.value = ''

  try {
    await $fetch(`/api/admin/topics/${id}`, {
      method: 'DELETE'
    })
    topics.value = (topics.value || []).filter((item) => item.id !== id)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '删除专题失败'
  } finally {
    deletingId.value = ''
  }
}

const handleManagerCreate = (payload: TopicEditorPayload | TagEditorPayload) =>
  handleCreate(payload as TopicEditorPayload)

const handleManagerUpdate = (
  id: string,
  payload: TopicEditorPayload | TagEditorPayload
) => handleUpdate(id, payload as TopicEditorPayload)
</script>

<template>
  <div class="space-y-6">
    <AppSurface class="space-y-5">
      <AdminPageHeader
        eyebrow="专题管理"
        title="维护站点的主知识结构"
        description="专题用于组织长期稳定的知识主线，例如 Vue 3、浏览器原理、计算机网络和 AI"
      />
      <p v-if="actionError" class="text-sm text-danger" aria-live="polite">{{ actionError }}</p>
    </AppSurface>

    <AppLoadingState
      v-if="pending"
      title="正在加载专题管理"
      description="正在读取专题列表和文章关联数量"
    />

    <AppErrorState
      v-else-if="error"
      title="专题管理不可用"
      :description="fetchErrorMessage"
      @action="refresh"
    />

    <AdminTaxonomyManager
      v-else
      kind="topic"
      :items="topics"
      :creating="creating"
      :saving-id="savingId"
      :deleting-id="deletingId"
      @create="handleManagerCreate"
      @update="handleManagerUpdate"
      @delete="handleDelete"
    />
  </div>
</template>
