<script setup lang="ts">
import type { ArticleEditorPayload, TagRecord, TopicRecord } from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

useSeoMeta({
  title: '新建文章',
  description: '在后台创建新的技术文章草稿'
})

const {
  data: meta,
  pending,
  error: metaError,
  refresh
} = useLazyFetch<{
  topics: TopicRecord[]
  tags: TagRecord[]
}>('/api/admin/meta', {
  default: () => ({
    topics: [],
    tags: []
  })
})

const metaErrorMessage = computed(() => {
  return getFetchStatusMessage(metaError.value) || '文章编辑器初始化失败'
})

const submitting = ref(false)
const actionError = ref('')

const handleCreate = async (payload: ArticleEditorPayload) => {
  submitting.value = true
  actionError.value = ''

  try {
    const article = await $fetch<{ id: string }>('/api/admin/articles', {
      method: 'POST',
      body: payload
    })
    await navigateTo(`/admin/articles/${article.id}`)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '创建文章失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <AppSurface class="space-y-5">
      <AdminPageHeader
        eyebrow="新建文章"
        title="创建下一篇技术内容"
        description="先录入基础信息，再补充专题、标签、封面和 SEO 数据，最终形成可发布的完整文章"
      />
      <p v-if="actionError" class="text-sm text-danger" aria-live="polite">{{ actionError }}</p>
    </AppSurface>

    <AppLoadingState
      v-if="pending"
      title="正在加载文章编辑器"
      description="正在读取专题和标签选项"
    />

    <AppErrorState
      v-else-if="metaError"
      title="文章编辑器不可用"
      :description="metaErrorMessage"
      @action="refresh"
    />

    <AdminArticleForm
      v-else
      mode="create"
      :topics="meta.topics"
      :tags="meta.tags"
      :submitting="submitting"
      @submit="handleCreate"
    />
  </div>
</template>
