<script setup lang="ts">
import { Clock3, ListTree, Sparkles } from 'lucide-vue-next'
import type { ArticleRecord } from '~/types/content-studio'
import { formatDisplayDate } from '~/utils/display'
import { getFetchStatusMessage } from '~/utils/fetch-error'
import { renderMarkdown } from '~/utils/markdown'

interface OutlineItem {
  id: string
  text: string
  depth: number
}

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug || ''))
const articleBodyRef = ref<HTMLElement | null>(null)
const articleContentColumnRef = ref<HTMLElement | null>(null)
const articleSideRailRef = ref<HTMLElement | null>(null)
const articleBodyMaxHeight = ref('')
const selectedText = ref('')
const articleBodyScrollStyle = computed(() =>
  articleBodyMaxHeight.value
    ? {
        maxHeight: articleBodyMaxHeight.value
      }
    : undefined
)
const desktopArticleLayoutWidth = 1280
const minimumArticleBodyHeight = 360
let articleLayoutResizeObserver: ResizeObserver | null = null
let articleLayoutFrame: number | null = null

const { data: article, error } = await useFetch<ArticleRecord>(
  () => `/api/articles/${slug.value}`,
  {
    watch: [slug]
  }
)

const {
  data: relatedArticles,
  error: relatedError,
  refresh: refreshRelated
} = await useFetch<ArticleRecord[]>(() => `/api/articles/${slug.value}/related`, {
  watch: [slug],
  default: () => []
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || '文章不存在'
  })
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
}

function createHeadingAnchorId(value: string, counts: Map<string, number>) {
  const base = value
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  const fallback = base || 'section'
  const currentCount = counts.get(fallback) || 0
  counts.set(fallback, currentCount + 1)

  return currentCount > 0 ? `${fallback}-${currentCount + 1}` : fallback
}

function buildArticleRenderState(markdown: string) {
  const html = renderMarkdown(markdown)
    .replace(/^<h1>[\s\S]*?<\/h1>\s*/u, '')
    .trim()
  const headingIds = new Map<string, number>()
  const outline: OutlineItem[] = []

  const renderedHtml = html.replace(/<h([1-3])>([\s\S]*?)<\/h\1>/g, (_match, level, innerHtml) => {
    const depth = Number(level)
    const text = stripHtml(String(innerHtml || ''))

    if (!text) {
      return `<h${level}>${innerHtml}</h${level}>`
    }

    const id = createHeadingAnchorId(text, headingIds)
    outline.push({
      id,
      text,
      depth
    })

    return `<h${level} id="${id}" class="scroll-mt-28">${innerHtml}</h${level}>`
  })

  return {
    html: renderedHtml,
    outline
  }
}

const articleRenderState = computed(() => buildArticleRenderState(article.value?.bodyMd || ''))
const articleOutline = computed(() => articleRenderState.value.outline)
const bodyHtml = computed(() => articleRenderState.value.html)

const canonicalUrl = computed(() => {
  const siteUrl = String(config.public.siteUrl || 'http://localhost:3000').replace(/\/+$/u, '')
  return `${siteUrl}/articles/${slug.value}`
})

const visibleRelatedArticles = computed(() => {
  return (relatedArticles.value || [])
    .filter((item: ArticleRecord) => item.id !== article.value?.id)
    .slice(0, 3)
})

const relatedArticlesErrorMessage = computed(() => {
  return getFetchStatusMessage(relatedError.value) || '相关文章暂时无法加载'
})

function clearSelectedText() {
  selectedText.value = ''
  window.getSelection()?.removeAllRanges()
}

function syncSelectedText() {
  const body = articleBodyRef.value
  const selection = window.getSelection()

  if (!body || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
    selectedText.value = ''
    return
  }

  const range = selection.getRangeAt(0)
  const text = selection.toString().replace(/\s+/gu, ' ').trim()

  if (!body.contains(range.commonAncestorContainer) || text.length < 8) {
    selectedText.value = ''
    return
  }

  selectedText.value = text.slice(0, 600)
}

function updateArticleBodyMaxHeight() {
  const body = articleBodyRef.value
  const sideRail = articleSideRailRef.value

  if (!import.meta.client || !body || !sideRail || window.innerWidth < desktopArticleLayoutWidth) {
    articleBodyMaxHeight.value = ''
    return
  }

  const bodyRect = body.getBoundingClientRect()
  const sideRailBottom =
    sideRail.lastElementChild?.getBoundingClientRect().bottom ??
    sideRail.getBoundingClientRect().bottom
  const contentPanel = body.parentElement
  const contentPanelStyle = contentPanel ? window.getComputedStyle(contentPanel) : null
  const panelPaddingBottom = contentPanelStyle
    ? Number.parseFloat(contentPanelStyle.paddingBottom) || 0
    : 0
  const availableHeight = Math.floor(sideRailBottom - bodyRect.top - panelPaddingBottom)
  const nextHeight = `${Math.max(availableHeight, minimumArticleBodyHeight)}px`

  if (articleBodyMaxHeight.value !== nextHeight) {
    articleBodyMaxHeight.value = nextHeight
  }
}

function scheduleArticleBodyLayout() {
  if (!import.meta.client || articleLayoutFrame !== null) {
    return
  }

  articleLayoutFrame = window.requestAnimationFrame(() => {
    articleLayoutFrame = null
    updateArticleBodyMaxHeight()
  })
}

onMounted(() => {
  document.addEventListener('selectionchange', syncSelectedText)

  window.addEventListener('resize', scheduleArticleBodyLayout)
  scheduleArticleBodyLayout()

  if ('ResizeObserver' in window) {
    articleLayoutResizeObserver = new ResizeObserver(scheduleArticleBodyLayout)

    for (const target of [articleContentColumnRef.value, articleSideRailRef.value]) {
      if (target) {
        articleLayoutResizeObserver.observe(target)
      }
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', syncSelectedText)
  window.removeEventListener('resize', scheduleArticleBodyLayout)
  articleLayoutResizeObserver?.disconnect()

  if (articleLayoutFrame !== null) {
    window.cancelAnimationFrame(articleLayoutFrame)
  }
})

watch(
  () => article.value?.slug,
  () => {
    if (import.meta.client) {
      clearSelectedText()
      nextTick(scheduleArticleBodyLayout)
    } else {
      selectedText.value = ''
    }
  }
)

useSeoMeta({
  title: () => article.value?.seoTitle || article.value?.title || '文章详情',
  description: () => article.value?.seoDescription || article.value?.summary || '技术文章详情页',
  ogTitle: () => article.value?.seoTitle || article.value?.title || '文章详情',
  ogDescription: () => article.value?.seoDescription || article.value?.summary || '',
  twitterCard: 'summary_large_image'
})

useHead(() => ({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl.value
    }
  ]
}))
</script>

<template>
  <div v-if="article" class="app-container app-section">
    <div class="grid gap-6 xl:grid-cols-[1.05fr_0.55fr] xl:items-start">
      <div ref="articleContentColumnRef" class="space-y-6">
        <AppSurface class="space-y-5">
          <div class="flex flex-wrap gap-2">
            <NuxtLink v-if="article.topic" :to="`/topics/${article.topic.slug}`">
              <AppStatusPill>{{ article.topic.name }}</AppStatusPill>
            </NuxtLink>
            <AppStatusPill v-else>未分配专题</AppStatusPill>
            <AppStatusPill>{{ article.readingTime }} 分钟</AppStatusPill>
            <AppStatusPill>
              {{ formatDisplayDate(article.publishedAt) }}
            </AppStatusPill>
          </div>
          <div class="space-y-4">
            <h1
              class="max-w-4xl text-[2.4rem] font-semibold leading-[1.04] tracking-tight md:text-[3.3rem]"
            >
              {{ article.title }}
            </h1>
            <p class="max-w-3xl body-copy">
              {{ article.summary }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <NuxtLink v-for="tag in article.tags" :key="tag.id" :to="`/tags/${tag.slug}`">
              <AppStatusPill>{{ tag.name }}</AppStatusPill>
            </NuxtLink>
          </div>
        </AppSurface>

        <AppSurface class="space-y-5">
          <p class="eyebrow">正文内容</p>
          <p class="body-copy">在正文中选中一段文字后，可直接发送给 AI 阅读助手进行解释</p>
          <div
            ref="articleBodyRef"
            class="markdown-content article-body-scroll panel-scroll"
            :style="articleBodyScrollStyle"
            v-html="bodyHtml"
          />
        </AppSurface>

        <AppErrorState
          v-if="relatedError"
          title="相关文章暂不可用"
          :description="relatedArticlesErrorMessage"
          @action="refreshRelated"
        />

        <AppSurface v-else-if="visibleRelatedArticles.length" class="space-y-5">
          <div class="space-y-2">
            <p class="eyebrow">相关文章</p>
            <h2 class="panel-title">沿着同一条技术脉络继续阅读</h2>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="item in visibleRelatedArticles"
              :key="item.id"
              class="rounded-[1.6rem] border border-line/[0.15] bg-surface-muted/45 p-5 transition hover:border-accent/25 hover:bg-surface-muted/70"
            >
              <div class="flex flex-wrap gap-2">
                <NuxtLink v-if="item.topic" :to="`/topics/${item.topic.slug}`">
                  <AppStatusPill tone="accent">{{ item.topic.name }}</AppStatusPill>
                </NuxtLink>
                <AppStatusPill>{{ item.readingTime }} 分钟</AppStatusPill>
              </div>
              <h3 class="mt-4 panel-title-sm">{{ item.title }}</h3>
              <p class="mt-2 body-copy">{{ item.summary }}</p>
              <NuxtLink
                :to="`/articles/${item.slug}`"
                class="mt-4 inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-warm"
              >
                阅读文章
              </NuxtLink>
            </div>
          </div>
        </AppSurface>
      </div>

      <div ref="articleSideRailRef" class="space-y-6">
        <AppSurface class="space-y-4">
          <p class="eyebrow">阅读信息</p>
          <div class="flex items-start gap-3">
            <Clock3 class="mt-1 size-4 text-accent" />
            <div>
              <p class="text-sm font-medium text-ink-strong">预计阅读时长</p>
              <p class="text-sm leading-7 text-ink-soft">{{ article.readingTime }} 分钟</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <Sparkles class="mt-1 size-4 text-accent" />
            <div>
              <p class="text-sm font-medium text-ink-strong">摘要说明</p>
              <p class="text-sm leading-7 text-ink-soft">{{ article.seoDescription }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <NuxtLink v-if="article.topic" :to="`/topics/${article.topic.slug}`">
              <AppStatusPill tone="accent">专题：{{ article.topic.name }}</AppStatusPill>
            </NuxtLink>
            <NuxtLink to="/tags">
              <AppStatusPill>查看标签</AppStatusPill>
            </NuxtLink>
          </div>
        </AppSurface>

        <AppSurface class="space-y-4">
          <p class="eyebrow">文章目录</p>
          <div class="space-y-3">
            <a
              v-for="item in articleOutline"
              :key="item.id"
              :href="`#${item.id}`"
              class="flex items-start gap-3 rounded-2xl px-3 py-2 text-sm leading-7 text-ink-soft transition hover:bg-surface-muted/60 hover:text-ink-strong"
              :class="item.depth === 3 ? 'pl-7' : item.depth === 2 ? 'pl-4' : ''"
            >
              <ListTree class="mt-1 size-4 shrink-0 text-accent-warm" />
              <span>{{ item.text }}</span>
            </a>
            <p v-if="articleOutline.length === 0" class="text-sm leading-7 text-ink-soft">
              请在后台正文中使用 Markdown 标题，前台会自动生成目录
            </p>
          </div>
        </AppSurface>

        <ArticlesArticleAiAssistant
          :article="article"
          :selected-text="selectedText"
          @clear-selection="clearSelectedText"
        />
      </div>
    </div>
  </div>

  <AppEmptyState
    v-else
    class="app-container app-section"
    title="文章暂不可用"
    description="当前文章无法加载，请返回文章归档页后重试"
  />
</template>
