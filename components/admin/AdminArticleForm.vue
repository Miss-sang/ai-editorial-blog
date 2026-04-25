<script setup lang="ts">
import { ImagePlus, Sparkles, Trash2, UploadCloud } from 'lucide-vue-next'
import type {
  ArticleEditorPayload,
  ArticleRecord,
  TagRecord,
  TopicRecord,
  UploadResult
} from '~/types/content-studio'
import { articleStatusOptions } from '~/types/content-studio'
import {
  formatDisplayDateTime,
  getArticleStatusLabel
} from '~/utils/display'
import { renderMarkdown } from '~/utils/markdown'

const props = withDefaults(
  defineProps<{
    article?: ArticleRecord | null
    topics?: TopicRecord[]
    tags?: TagRecord[]
    submitting?: boolean
    allowDelete?: boolean
    mode: 'create' | 'edit'
  }>(),
  {
    article: null,
    topics: () => [],
    tags: () => [],
    submitting: false,
    allowDelete: false
  }
)

const emit = defineEmits<{
  submit: [payload: ArticleEditorPayload]
  delete: []
}>()

const createClientSlug = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

const createInitialForm = (): ArticleEditorPayload => ({
  title: props.article?.title ?? '',
  slug: props.article?.slug ?? '',
  summary: props.article?.summary ?? '',
  excerpt: props.article?.excerpt ?? '',
  bodyMd: props.article?.bodyMd ?? '',
  coverImageUrl: props.article?.coverImageUrl ?? '',
  status: props.article?.status ?? 'DRAFT',
  isFeatured: props.article?.isFeatured ?? false,
  topicName: props.article?.topic?.name ?? '',
  tagNames: props.article?.tags.map((tag) => tag.name) ?? [],
  seoTitle: props.article?.seoTitle ?? '',
  seoDescription: props.article?.seoDescription ?? ''
})

const form = reactive(createInitialForm())
const tagInput = ref(form.tagNames.join(', '))
const uploadState = ref<UploadResult | null>(null)
const uploadPending = ref(false)
const uploadError = ref('')
const manualSlug = ref(Boolean(props.article?.slug))
const formIdPrefix = computed(() => props.article?.id || `${props.mode}-article`)

watch(
  () => props.article,
  (article) => {
    Object.assign(form, createInitialForm())
    tagInput.value = article?.tags.map((tag) => tag.name).join(', ') ?? ''
    manualSlug.value = Boolean(article?.slug)
  }
)

watch(
  () => form.title,
  (title) => {
    if (!manualSlug.value) {
      form.slug = createClientSlug(title)
    }
  }
)

const previewHtml = computed(() => {
  return renderMarkdown(form.bodyMd || '# 在这里开始撰写文章\n\n先写问题，再写方案，再写代码细节')
})

const statusTone = (
  status: ArticleEditorPayload['status']
): 'accent' | 'success' | 'warning' | 'neutral' => {
  if (status === 'PUBLISHED') {
    return 'success'
  }

  if (status === 'REVIEW') {
    return 'warning'
  }

  return status === 'ARCHIVED' ? 'neutral' : 'accent'
}

const updatedLabel = computed(() => formatDisplayDateTime(props.article?.updatedAt))
const publishedLabel = computed(() => formatDisplayDateTime(props.article?.publishedAt, '未发布'))

const syncTags = () => {
  form.tagNames = tagInput.value
    .replace(/，/gu, ',')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const handleSlugInput = () => {
  manualSlug.value = true
}

const handleCoverUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  uploadPending.value = true
  uploadError.value = ''

  try {
    const body = new FormData()
    body.append('file', file)
    uploadState.value = await $fetch<UploadResult>('/api/admin/uploads/cover', {
      method: 'POST',
      body
    })
    form.coverImageUrl = uploadState.value.url
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : '封面上传失败'
  } finally {
    uploadPending.value = false
    input.value = ''
  }
}

const uploadProviderLabel = computed(() => {
  if (!uploadState.value) {
    return ''
  }

  return uploadState.value.provider === 'supabase' ? 'Supabase 存储' : '本地内联存储'
})

const submitForm = () => {
  syncTags()
  emit('submit', {
    ...form
  })
}

const fieldClass =
  'w-full rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition placeholder:text-ink-faint focus:border-accent/40'
</script>

<template>
  <form class="space-y-6" :aria-busy="submitting || uploadPending ? 'true' : 'false'" @submit.prevent="submitForm">
    <AppSurface class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <p class="eyebrow">文章编辑器</p>
          <h2 class="text-2xl font-semibold tracking-tight">
            {{ mode === 'create' ? '新建文章' : '编辑文章' }}
          </h2>
          <p class="text-sm leading-7 text-ink-soft">
            标题、摘要、Markdown 正文、封面、专题、标签和 SEO 信息统一在这里维护
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppStatusPill :tone="statusTone(form.status)">
            {{ getArticleStatusLabel(form.status) }}
          </AppStatusPill>
          <AppStatusPill>
            最近保存 {{ updatedLabel }}
          </AppStatusPill>
          <AppStatusPill>
            发布时间 {{ publishedLabel }}
          </AppStatusPill>
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">标题</span>
          <input
            :id="`${formIdPrefix}-title`"
            v-model="form.title"
            type="text"
            :class="fieldClass"
            placeholder="Vue 3 与 TypeScript 组件协作实践"
          >
        </label>
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">标识</span>
          <input
            :id="`${formIdPrefix}-slug`"
            v-model="form.slug"
            type="text"
            :class="fieldClass"
            placeholder="vue3-typescript-component-patterns"
            @input="handleSlugInput"
          >
        </label>
      </div>

      <div class="grid gap-5 xl:grid-cols-[1fr_220px_180px]">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">专题</span>
          <input
            :id="`${formIdPrefix}-topic`"
            v-model="form.topicName"
            :list="`${formIdPrefix}-topic-options`"
            type="text"
            :class="fieldClass"
            placeholder="Vue 3 与 TypeScript"
          >
          <datalist :id="`${formIdPrefix}-topic-options`">
            <option v-for="topic in topics" :key="topic.id" :value="topic.name" />
          </datalist>
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">状态</span>
          <select :id="`${formIdPrefix}-status`" v-model="form.status" :class="fieldClass">
            <option v-for="status in articleStatusOptions" :key="status" :value="status">
              {{ getArticleStatusLabel(status) }}
            </option>
          </select>
        </label>

        <label class="flex items-center gap-3 rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3">
          <input
            :id="`${formIdPrefix}-featured`"
            v-model="form.isFeatured"
            type="checkbox"
            class="size-4 rounded border-line/[0.2] bg-transparent text-accent focus:ring-accent"
          >
          <span class="text-sm font-medium text-ink-strong">设为精选文章</span>
        </label>
      </div>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-ink-strong">卡片摘要</span>
        <textarea
          :id="`${formIdPrefix}-summary`"
          v-model="form.summary"
          rows="3"
          :class="fieldClass"
          placeholder="用于首页、列表页和后台列表的短摘要"
        ></textarea>
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-ink-strong">详情摘要</span>
        <textarea
          :id="`${formIdPrefix}-excerpt`"
          v-model="form.excerpt"
          rows="4"
          :class="fieldClass"
          placeholder="用于文章详情页开头的延展摘要"
        ></textarea>
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-ink-strong">标签</span>
        <input
          :id="`${formIdPrefix}-tags`"
          v-model="tagInput"
          type="text"
          :class="fieldClass"
          placeholder="Vue 3, TypeScript, 组件通信"
          :aria-describedby="`${formIdPrefix}-tags-hint`"
          @blur="syncTags"
        >
        <p :id="`${formIdPrefix}-tags-hint`" class="text-xs text-ink-faint">
          多个标签请用逗号分隔，当前可复用标签：{{ tags.map((tag) => tag.name).join('、') || '暂无' }}
        </p>
      </label>
    </AppSurface>

    <AppSurface class="space-y-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="space-y-2">
          <p class="eyebrow">封面与存储</p>
          <h2 class="text-2xl font-semibold tracking-tight">封面图片</h2>
          <p class="text-sm leading-7 text-ink-soft">
            如果已配置 Supabase，将优先写入对象存储，否则会退回到本地内联模式，保证录入流程不中断
          </p>
        </div>
        <label
          :for="`${formIdPrefix}-cover-upload`"
          class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line/[0.15] bg-surface px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
        >
          <UploadCloud class="size-4" />
          {{ uploadPending ? '上传中...' : '上传封面' }}
          <input
            :id="`${formIdPrefix}-cover-upload`"
            type="file"
            accept="image/*"
            class="hidden"
            :disabled="uploadPending"
            @change="handleCoverUpload"
          >
        </label>
      </div>

      <div class="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div class="grid gap-4">
          <label class="grid gap-2">
            <span class="text-sm font-medium text-ink-strong">封面地址</span>
            <input
              :id="`${formIdPrefix}-cover-url`"
              v-model="form.coverImageUrl"
              type="text"
              :class="fieldClass"
              placeholder="https://..."
              :aria-describedby="`${formIdPrefix}-cover-status`"
            >
          </label>
          <div :id="`${formIdPrefix}-cover-status`" class="flex flex-wrap gap-2" aria-live="polite">
            <AppStatusPill v-if="uploadState" tone="accent">
              {{ uploadProviderLabel }} 已准备就绪
            </AppStatusPill>
            <p v-if="uploadError" class="text-sm text-danger">{{ uploadError }}</p>
          </div>
        </div>

        <div class="surface-frame-strong flex min-h-[220px] items-center justify-center overflow-hidden p-0">
          <img
            v-if="form.coverImageUrl"
            :src="form.coverImageUrl"
            alt="封面预览"
            class="h-full w-full object-cover"
          >
          <div v-else class="flex flex-col items-center gap-3 px-6 text-center text-ink-faint">
            <ImagePlus class="size-7 text-accent" />
            <p class="text-sm leading-7">
              上传封面图片或粘贴已有地址后，可在这里预览显示效果
            </p>
          </div>
        </div>
      </div>
    </AppSurface>

    <div class="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
      <AppSurface class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow">Markdown 正文</p>
            <h2 class="text-2xl font-semibold tracking-tight">写作区</h2>
          </div>
          <AppStatusPill tone="accent">
            <Sparkles class="size-3.5" />
            {{ form.bodyMd ? '已填写正文' : '等待录入正文' }}
          </AppStatusPill>
        </div>

        <textarea
          :id="`${formIdPrefix}-body`"
          v-model="form.bodyMd"
          rows="22"
          class="min-h-[560px] w-full rounded-[1.6rem] border border-line/[0.15] bg-[#0f1720] px-5 py-4 font-mono text-sm leading-7 text-[#e7edf7] outline-none transition focus:border-accent/40"
          placeholder="# 先说明问题背景，再写解决方案和代码细节"
        ></textarea>
      </AppSurface>

      <AppSurface class="space-y-4">
        <div>
          <p class="eyebrow">渲染预览</p>
          <h2 class="text-2xl font-semibold tracking-tight">阅读检查</h2>
        </div>
        <div
          class="markdown-content rounded-[1.6rem] border border-line/[0.15] bg-[#0b1118] p-6"
          v-html="previewHtml"
        />
      </AppSurface>
    </div>

    <AppSurface class="space-y-5">
      <div>
        <p class="eyebrow">SEO 与发布</p>
        <h2 class="text-2xl font-semibold tracking-tight">元信息</h2>
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">SEO 标题</span>
          <input
            :id="`${formIdPrefix}-seo-title`"
            v-model="form.seoTitle"
            type="text"
            :class="fieldClass"
            placeholder="搜索结果中展示的标题"
          >
        </label>
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">SEO 描述</span>
          <textarea
            :id="`${formIdPrefix}-seo-description`"
            v-model="form.seoDescription"
            rows="3"
            :class="fieldClass"
            placeholder="用于搜索摘要和社交分享描述"
          ></textarea>
        </label>
      </div>

      <div class="flex flex-col gap-3 border-t border-line/10 pt-5 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap gap-2">
          <AppStatusPill>{{ getArticleStatusLabel(form.status) }}</AppStatusPill>
          <AppStatusPill>{{ form.tagNames.length }} 个标签</AppStatusPill>
          <AppStatusPill>{{ form.topicName || '未分配专题' }}</AppStatusPill>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <button
            v-if="allowDelete"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-danger/30 px-4 py-2 text-sm text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
            @click="$emit('delete')"
          >
            <Trash2 class="size-4" />
            删除文章
          </button>
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submitting"
          >
            <Sparkles class="size-4" />
            {{ submitting ? '保存中...' : mode === 'create' ? '创建文章' : '保存修改' }}
          </button>
        </div>
      </div>
    </AppSurface>
  </form>
</template>
