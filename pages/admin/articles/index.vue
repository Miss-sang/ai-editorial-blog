<script setup lang="ts">
import { PencilLine, Plus, Trash2 } from 'lucide-vue-next'
import type { ArticleRecord, ArticleStatusAction } from '~/types/content-studio'
import { getFetchStatusMessage } from '~/utils/fetch-error'
import {
  formatDisplayDateTime,
  getArticleStatusLabel
} from '~/utils/display'

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth']
})

useSeoMeta({
  title: '后台文章',
  description: '统一管理文章草稿、审核、发布和归档状态'
})

const query = ref('')
const statusFilter = ref<'ALL' | ArticleRecord['status']>('ALL')

const {
  data: articles,
  pending,
  error,
  refresh
} = useLazyFetch<ArticleRecord[]>('/api/admin/articles', {
  default: () => []
})

const fetchErrorMessage = computed(() => {
  return getFetchStatusMessage(error.value) || '文章列表暂时无法加载'
})

const filteredArticles = computed(() => {
  return (articles.value || []).filter((article) => {
    const matchesStatus = statusFilter.value === 'ALL' || article.status === statusFilter.value
    const normalizedQuery = query.value.trim().toLowerCase()
    const haystack = `${article.title} ${article.summary} ${article.slug} ${article.topic?.name || ''}`.toLowerCase()

    return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery))
  })
})

const deletePendingId = ref('')
const actionState = reactive<Record<string, ArticleStatusAction | ''>>({})
const actionError = ref('')

const handleDelete = async (article: ArticleRecord) => {
  const confirmed = confirm(`确认删除文章《${article.title}》吗？`)

  if (!confirmed) {
    return
  }

  deletePendingId.value = article.id
  actionError.value = ''

  try {
    await $fetch(`/api/admin/articles/${article.id}`, {
      method: 'DELETE'
    })
    articles.value = articles.value.filter((item) => item.id !== article.id)
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '删除文章失败'
  } finally {
    deletePendingId.value = ''
  }
}

const handleStatusAction = async (article: ArticleRecord, action: ArticleStatusAction) => {
  actionState[article.id] = action
  actionError.value = ''

  try {
    const updatedArticle = await $fetch<ArticleRecord>(`/api/admin/articles/${article.id}/status`, {
      method: 'PATCH',
      query: {
        compact: '1'
      },
      body: {
        action
      }
    })
    articles.value = articles.value.map((item) =>
      item.id === updatedArticle.id ? updatedArticle : item
    )
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : '更新文章状态失败'
  } finally {
    actionState[article.id] = ''
  }
}

const toneForStatus = (status: ArticleRecord['status']) => {
  if (status === 'PUBLISHED') {
    return 'success'
  }

  if (status === 'REVIEW') {
    return 'warning'
  }

  return status === 'ARCHIVED' ? 'neutral' : 'accent'
}
</script>

<template>
  <div class="space-y-6">
    <AppSurface class="space-y-5">
      <AdminPageHeader
        eyebrow="文章管理"
        title="统一处理草稿、审核与发布"
        description="后台文章列表是内容流转的核心入口，可在这里搜索、筛选、编辑、发布、归档或删除文章"
      >
        <NuxtLink
          to="/admin/articles/new"
          class="inline-flex items-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
        >
          <Plus class="size-4" />
          新建文章
        </NuxtLink>
      </AdminPageHeader>

      <div class="grid gap-4 xl:grid-cols-[1fr_180px]">
        <label class="grid gap-2">
          <span class="sr-only">搜索文章</span>
          <input
            v-model="query"
            type="text"
            class="w-full rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition placeholder:text-ink-faint focus:border-accent/40"
            placeholder="按标题、摘要、标识或专题搜索"
          >
        </label>
        <label class="grid gap-2">
          <span class="sr-only">按状态筛选文章</span>
          <select
            v-model="statusFilter"
            class="w-full rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition focus:border-accent/40"
          >
            <option value="ALL">全部状态</option>
            <option value="DRAFT">草稿</option>
            <option value="REVIEW">待审核</option>
            <option value="PUBLISHED">已发布</option>
            <option value="ARCHIVED">已归档</option>
          </select>
        </label>
      </div>

      <p v-if="actionError" class="text-sm text-danger" aria-live="polite">
        {{ actionError }}
      </p>
    </AppSurface>

    <AppLoadingState
      v-if="pending"
      title="正在加载文章列表"
      description="正在读取文章草稿、发布状态和关联信息"
    />

    <AppErrorState
      v-else-if="error"
      title="文章列表不可用"
      :description="fetchErrorMessage"
      @action="refresh"
    />

    <div v-else class="grid gap-4">
      <AppSurface
        v-for="article in filteredArticles"
        :key="article.id"
        class="grid gap-5 xl:grid-cols-[1fr_auto]"
      >
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <AppStatusPill :tone="toneForStatus(article.status)">
              {{ getArticleStatusLabel(article.status) }}
            </AppStatusPill>
            <AppStatusPill>{{ article.topic?.name || '未分配专题' }}</AppStatusPill>
            <AppStatusPill>{{ article.readingTime }} 分钟</AppStatusPill>
            <AppStatusPill v-if="article.isFeatured" tone="accent">精选文章</AppStatusPill>
          </div>
          <div>
            <h2 class="text-2xl font-semibold tracking-tight">{{ article.title }}</h2>
            <p class="mt-2 max-w-3xl text-sm leading-7 text-ink-soft md:text-base">
              {{ article.summary }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppStatusPill v-for="tag in article.tags" :key="tag.id">{{ tag.name }}</AppStatusPill>
          </div>
        </div>

        <div class="flex flex-col gap-3 xl:items-end">
          <p class="text-sm text-ink-faint">
            更新于 {{ formatDisplayDateTime(article.updatedAt) }}
          </p>
          <AdminArticleStatusActions
            :article="article"
            :pending-action="actionState[article.id] || ''"
            @action="handleStatusAction(article, $event)"
          />
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              :to="`/admin/articles/${article.id}`"
              class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
            >
              <PencilLine class="size-4" />
              编辑
            </NuxtLink>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-danger/30 px-4 py-2 text-sm text-danger transition hover:bg-danger/10"
              :disabled="deletePendingId === article.id"
              @click="handleDelete(article)"
            >
              <Trash2 class="size-4" />
              {{ deletePendingId === article.id ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>
      </AppSurface>
    </div>

    <AppEmptyState
      v-if="!pending && !error && filteredArticles.length === 0"
      title="当前筛选条件下没有文章"
      description="可以放宽搜索条件、切换状态筛选，或直接新建第一篇文章"
    />
  </div>
</template>
