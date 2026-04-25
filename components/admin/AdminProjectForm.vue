<script setup lang="ts">
import { FolderKanban, Save, Trash2 } from 'lucide-vue-next'
import type { ProjectEditorPayload, ProjectRecord } from '~/types/content-studio'
import { projectStatusOptions } from '~/types/content-studio'
import {
  formatDisplayDateTime,
  getProjectStatusLabel
} from '~/utils/display'
import { renderMarkdown } from '~/utils/markdown'

const props = withDefaults(
  defineProps<{
    project?: ProjectRecord | null
    submitting?: boolean
    allowDelete?: boolean
    mode: 'create' | 'edit'
  }>(),
  {
    project: null,
    submitting: false,
    allowDelete: false
  }
)

const emit = defineEmits<{
  submit: [payload: ProjectEditorPayload]
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

const createInitialForm = (): ProjectEditorPayload => ({
  title: props.project?.title ?? '',
  slug: props.project?.slug ?? '',
  summary: props.project?.summary ?? '',
  contentMd: props.project?.contentMd ?? '',
  stack: props.project?.stack ?? [],
  repoUrl: props.project?.repoUrl ?? '',
  demoUrl: props.project?.demoUrl ?? '',
  status: props.project?.status ?? 'BUILDING',
  isFeatured: props.project?.isFeatured ?? false
})

const form = reactive(createInitialForm())
const stackInput = ref(form.stack.join(', '))
const manualSlug = ref(Boolean(props.project?.slug))

watch(
  () => props.project,
  () => {
    Object.assign(form, createInitialForm())
    stackInput.value = props.project?.stack.join(', ') ?? ''
    manualSlug.value = Boolean(props.project?.slug)
  }
)

watch(
  () => form.title,
  (value) => {
    if (!manualSlug.value) {
      form.slug = createClientSlug(value)
    }
  }
)

const previewHtml = computed(() => {
  return renderMarkdown(form.contentMd || '# 项目背景\n\n## 目标\n## 技术方案\n## 页面亮点')
})

const updatedLabel = computed(() => formatDisplayDateTime(props.project?.updatedAt))
const publishedLabel = computed(() => formatDisplayDateTime(props.project?.publishedAt, '尚未上线'))

const syncStack = () => {
  form.stack = stackInput.value
    .replace(/，/gu, ',')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const fieldClass =
  'w-full rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition placeholder:text-ink-faint focus:border-accent/40'

const handleSlugInput = () => {
  manualSlug.value = true
}

const submitForm = () => {
  syncStack()
  emit('submit', {
    ...form
  })
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="submitForm">
    <AppSurface class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <p class="eyebrow">项目编辑器</p>
          <h2 class="text-2xl font-semibold tracking-tight">
            {{ mode === 'create' ? '新建项目案例' : '编辑项目案例' }}
          </h2>
          <p class="text-sm leading-7 text-ink-soft">
            项目简介、技术栈、仓库地址、演示地址和案例说明统一在这里维护
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppStatusPill tone="accent">{{ getProjectStatusLabel(form.status) }}</AppStatusPill>
          <AppStatusPill>最近保存 {{ updatedLabel }}</AppStatusPill>
          <AppStatusPill>上线时间 {{ publishedLabel }}</AppStatusPill>
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-2">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">项目名称</span>
          <input v-model="form.title" type="text" :class="fieldClass" placeholder="知栈技术博客平台">
        </label>
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">标识</span>
          <input
            v-model="form.slug"
            type="text"
            :class="fieldClass"
            placeholder="zhizhan-tech-blog-platform"
            @input="handleSlugInput"
          >
        </label>
      </div>

      <div class="grid gap-5 xl:grid-cols-[1fr_220px_180px]">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">项目摘要</span>
          <textarea
            v-model="form.summary"
            rows="3"
            :class="fieldClass"
            placeholder="用于前台项目区和后台列表的简要说明"
          ></textarea>
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">状态</span>
          <select v-model="form.status" :class="fieldClass">
            <option v-for="status in projectStatusOptions" :key="status" :value="status">
              {{ getProjectStatusLabel(status) }}
            </option>
          </select>
        </label>

        <label class="flex items-center gap-3 rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3">
          <input v-model="form.isFeatured" type="checkbox" class="size-4 rounded border-line/[0.2] bg-transparent text-accent focus:ring-accent">
          <span class="text-sm font-medium text-ink-strong">设为精选项目</span>
        </label>
      </div>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-ink-strong">技术栈</span>
        <input
          v-model="stackInput"
          type="text"
          :class="fieldClass"
          placeholder="Nuxt 3, TypeScript, Prisma, Supabase"
          @blur="syncStack"
        >
        <p class="text-xs text-ink-faint">
          多个技术点请用逗号分隔，这些标签会直接展示在前台项目区
        </p>
      </label>

      <div class="grid gap-5 xl:grid-cols-2">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">GitHub 仓库地址</span>
          <input v-model="form.repoUrl" type="url" :class="fieldClass" placeholder="https://github.com/..." >
        </label>
        <label class="grid gap-2">
          <span class="text-sm font-medium text-ink-strong">在线演示地址</span>
          <input v-model="form.demoUrl" type="url" :class="fieldClass" placeholder="https://..." >
        </label>
      </div>
    </AppSurface>

    <div class="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
      <AppSurface class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow">项目说明</p>
            <h2 class="text-2xl font-semibold tracking-tight">案例正文</h2>
          </div>
          <AppStatusPill tone="accent">
            <FolderKanban class="size-3.5" />
            {{ form.stack.length }} 项技术
          </AppStatusPill>
        </div>

        <textarea
          v-model="form.contentMd"
          rows="20"
          class="min-h-[520px] w-full rounded-[1.6rem] border border-line/[0.15] bg-[#0f1720] px-5 py-4 font-mono text-sm leading-7 text-[#e7edf7] outline-none transition focus:border-accent/40"
          placeholder="# 项目背景&#10;&#10;## 目标&#10;## 架构设计&#10;## 前端亮点"
        ></textarea>
      </AppSurface>

      <AppSurface class="space-y-4">
        <div>
          <p class="eyebrow">渲染预览</p>
          <h2 class="text-2xl font-semibold tracking-tight">案例阅读效果</h2>
        </div>
        <div
          class="markdown-content rounded-[1.6rem] border border-line/[0.15] bg-[#0b1118] p-6"
          v-html="previewHtml"
        />
      </AppSurface>
    </div>

    <AppSurface class="space-y-5">
      <div class="flex flex-col gap-3 border-t border-line/10 pt-5 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap gap-2">
          <AppStatusPill>{{ getProjectStatusLabel(form.status) }}</AppStatusPill>
          <AppStatusPill>{{ form.stack.length }} 项技术</AppStatusPill>
          <AppStatusPill v-if="form.isFeatured" tone="accent">精选项目</AppStatusPill>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <button
            v-if="allowDelete"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-danger/30 px-4 py-2 text-sm text-danger transition hover:bg-danger/10"
            @click="$emit('delete')"
          >
            <Trash2 class="size-4" />
            删除项目
          </button>
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
            :disabled="submitting"
          >
            <Save class="size-4" />
            {{ submitting ? '保存中...' : mode === 'create' ? '创建项目' : '保存修改' }}
          </button>
        </div>
      </div>
    </AppSurface>
  </form>
</template>
