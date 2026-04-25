<script setup lang="ts">
import type {
  ArticleEditorPayload,
  ArticleRecord,
  ArticleStatusAction,
  TagRecord,
  TopicRecord
} from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

const route = useRoute()
const articleId = computed(() => String(route.params.id || ''))

const {
  data: article,
  pending: articlePending,
  error: articleError,
  refresh: refreshArticle
} = await useFetch<ArticleRecord>(() => `/api/admin/articles/${articleId.value}`, {
  watch: [articleId]
})

const {
  data: meta,
  pending: metaPending,
  error: metaError,
  refresh: refreshMeta
} = await useFetch<{
  topics: TopicRecord[]
  tags: TagRecord[]
}>('/api/admin/meta', {
  default: () => ({
    topics: [],
    tags: []
  })
})

useSeoMeta({
  title: article.value ? `编辑 ${article.value.title}` : '编辑文章',
  description: '编辑文章元信息、正文、封面和发布状态'
})

const editorPending = computed(() => articlePending.value || metaPending.value)
const editorErrorMessage = computed(() => {
  if (articleError.value) {
    return getFetchStatusMessage(articleError.value) || '目标文章暂时无法读取'
  }

  if (metaError.value) {
    return getFetchStatusMessage(metaError.value) || '文章元数据暂时无法读取'
  }

  return ''
})

const submitting = ref(false)
const actionPending = ref<ArticleStatusAction | ''>('')
const actionError = ref('')

const refreshEditor = async () => {
  await Promise.all([refreshArticle(), refreshMeta()])
}

const handleSave = async (payload: ArticleEditorPayload) => {
  submitting.value = true
  actionError.value = ''

  try {
    await $fetch(`/api/admin/articles/${articleId.value}`, {
      method: 'PATCH',
      body: payload
    })
    await Promise.all([refreshArticle(), refreshMeta()])
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '保存文章失败'
  } finally {
    submitting.value = false
  }
}

const handleStatusAction = async (action: ArticleStatusAction) => {
  actionPending.value = action
  actionError.value = ''

  try {
    await $fetch(`/api/admin/articles/${articleId.value}/status`, {
      method: 'PATCH',
      body: {
        action
      }
    })
    await refreshArticle()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '更新文章状态失败'
  } finally {
    actionPending.value = ''
  }
}

const handleDelete = async () => {
  if (!article.value) {
    return
  }

  const confirmed = confirm(`确认删除文章《${article.value.title}》吗？`)

  if (!confirmed) {
    return
  }

  actionError.value = ''

  try {
    await $fetch(`/api/admin/articles/${articleId.value}`, {
      method: 'DELETE'
    })

    await navigateTo('/admin/articles')
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '删除文章失败'
  }
}

const publicArticlePath = computed(() => {
  if (!article.value) {
    return '/articles'
  }

  return article.value.status === 'PUBLISHED' ? `/articles/${article.value.slug}` : '/articles'
})

const publicArticleLabel = computed(() => {
  if (!article.value) {
    return '返回前台文章页'
  }

  return article.value.status === 'PUBLISHED' ? '查看前台文章' : '返回前台文章列表'
})
</script>

<template>
  <div class="space-y-6">
    <AppSurface class="space-y-5">
      <AdminPageHeader
        eyebrow="编辑文章"
        :title="article?.title || '正在加载文章...'"
        description="文章元信息、Markdown 正文、封面上传和发布状态都在这个编辑界面统一维护"
      >
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            :to="publicArticlePath"
            class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
          >
            {{ publicArticleLabel }}
          </NuxtLink>
          <NuxtLink
            to="/admin/articles"
            class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
          >
            返回文章列表
          </NuxtLink>
        </div>
      </AdminPageHeader>
      <p v-if="actionError" class="text-sm text-danger" aria-live="polite">{{ actionError }}</p>
    </AppSurface>

    <AppLoadingState
      v-if="editorPending"
      title="正在加载文章编辑器"
      description="正在读取文章内容、专题选项和标签选项"
    />

    <AppErrorState
      v-else-if="articleError || metaError"
      title="文章编辑器不可用"
      :description="editorErrorMessage"
      @action="refreshEditor"
    />

    <template v-else-if="article">
      <AppSurface class="space-y-4">
        <div class="space-y-2">
          <p class="eyebrow">发布操作</p>
          <h2 class="text-2xl font-semibold tracking-tight">状态流转</h2>
          <p class="text-sm leading-7 text-ink-soft">
            保存正文后，可在这里快速切换草稿、待审核、已发布和已归档状态
          </p>
        </div>
        <AdminArticleStatusActions
          :article="article"
          :pending-action="actionPending"
          @action="handleStatusAction"
        />
      </AppSurface>

      <AdminArticleForm
        mode="edit"
        :article="article"
        :topics="meta.topics"
        :tags="meta.tags"
        :submitting="submitting"
        allow-delete
        @submit="handleSave"
        @delete="handleDelete"
      />
    </template>

    <AppEmptyState
      v-else
      title="文章不存在"
      description="未找到对应文章，请返回文章列表后重新选择"
    />
  </div>
</template>
