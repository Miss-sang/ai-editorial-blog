<script setup lang="ts">
import { marked } from 'marked'
import {
  Bot,
  Highlighter,
  LoaderCircle,
  MessageSquareText,
  RefreshCcw,
  SendHorizontal,
  Sparkles,
  X
} from 'lucide-vue-next'
import type {
  ArticleAiExplainResponse,
  ArticleAiStreamResponse,
  ArticleAiSummaryResponse
} from '~/types/ai-reader'
import type { ArticleRecord } from '~/types/content-studio'

interface SystemStatusResponse {
  status: string
  services: {
    longcat: boolean
  }
}

const props = defineProps<{
  article: ArticleRecord
  selectedText?: string
}>()

const emit = defineEmits<{
  (event: 'clear-selection'): void
}>()

const { data: systemStatus } = useFetch<SystemStatusResponse>('/api/system/status')

const aiReady = computed(() => Boolean(systemStatus.value?.services.longcat))
const selectedTextPreview = computed(() => String(props.selectedText || '').trim())

const summary = ref<ArticleAiSummaryResponse | null>(null)
const summaryPending = ref(false)
const summaryError = ref('')

const explainResult = ref<ArticleAiExplainResponse | null>(null)
const explainPending = ref(false)
const explainError = ref('')
const explainRequestId = ref(0)

const answer = ref<ArticleAiStreamResponse | null>(null)
const answerPending = ref(false)
const answerError = ref('')
const question = ref('')
const answerStreamController = ref<AbortController | null>(null)
const displayedAnswer = ref('')
const questionFieldId = computed(() => `article-ai-question-${props.article.id}`)
const questionHintId = computed(() => `${questionFieldId.value}-hint`)
const answerPanelId = computed(() => `${questionFieldId.value}-answer`)
let answerRevealFrame: number | null = null

const suggestedQuestions = computed(() => {
  const topicPrompt = props.article.topic?.name
    ? `这篇文章是如何展开 ${props.article.topic.name} 这个主题的？`
    : '这篇文章最核心的实现思路是什么？'

  return [
    `请用中文概括《${props.article.title}》的重点`,
    topicPrompt,
    '如果我准备继续实战，下一步应该做什么？'
  ]
})

function toErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const maybeData = error as {
      data?: {
        statusMessage?: string
        message?: string
      }
      statusMessage?: string
      message?: string
    }

    if (maybeData.data?.statusMessage) {
      return maybeData.data.statusMessage
    }

    if (maybeData.statusMessage) {
      return maybeData.statusMessage
    }

    if (maybeData.data?.message) {
      return maybeData.data.message
    }

    if (maybeData.message) {
      return maybeData.message
    }
  }

  return fallback
}

function resetExplainState() {
  explainRequestId.value += 1
  explainResult.value = null
  explainPending.value = false
  explainError.value = ''
}

function stopAnswerStream() {
  answerStreamController.value?.abort()
  answerStreamController.value = null
}

function stopAnswerReveal() {
  if (import.meta.client && answerRevealFrame !== null) {
    window.cancelAnimationFrame(answerRevealFrame)
  }

  answerRevealFrame = null
}

function resetAnswerState() {
  stopAnswerStream()
  stopAnswerReveal()
  answer.value = null
  answerPending.value = false
  answerError.value = ''
  displayedAnswer.value = ''
}

function resetAssistantState() {
  summary.value = null
  summaryError.value = ''
  question.value = ''
  resetExplainState()
  resetAnswerState()
}

watch(
  () => props.article.slug,
  () => {
    resetAssistantState()
  }
)

watch(
  () => props.selectedText,
  () => {
    resetExplainState()
  }
)

onBeforeUnmount(() => {
  stopAnswerStream()
  stopAnswerReveal()
})

async function generateSummary() {
  summaryPending.value = true
  summaryError.value = ''

  try {
    summary.value = await $fetch<ArticleAiSummaryResponse>('/api/ai/article-summary', {
      method: 'POST',
      body: {
        slug: props.article.slug
      }
    })
  } catch (error) {
    summaryError.value = toErrorMessage(error, '生成摘要失败')
  } finally {
    summaryPending.value = false
  }
}

async function explainSelection() {
  if (!selectedTextPreview.value) {
    explainError.value = '请先在文章正文中选中一段文字，再发起解释'
    return
  }

  explainPending.value = true
  explainError.value = ''
  explainResult.value = null
  const requestId = explainRequestId.value + 1
  explainRequestId.value = requestId
  const selection = selectedTextPreview.value

  try {
    const response = await $fetch<ArticleAiExplainResponse>('/api/ai/article-explain', {
      method: 'POST',
      body: {
        slug: props.article.slug,
        selection
      }
    })

    if (requestId !== explainRequestId.value || selectedTextPreview.value !== selection) {
      return
    }

    explainResult.value = response
  } catch (error) {
    if (requestId !== explainRequestId.value) {
      return
    }

    explainError.value = toErrorMessage(error, '划词解释失败')
  } finally {
    if (requestId === explainRequestId.value) {
      explainPending.value = false
    }
  }
}

async function readResponseError(response: Response) {
  try {
    const payload = (await response.json()) as {
      statusMessage?: string
      message?: string
      data?: {
        statusMessage?: string
      }
    }

    return payload.statusMessage || payload.data?.statusMessage || payload.message || ''
  } catch {
    const responseText = (await response.text()).trim()
    return responseText || `请求失败，状态码 ${response.status}`
  }
}

function parseSseChunk(rawChunk: string) {
  let event = 'message'
  const dataLines: string[] = []

  for (const rawLine of rawChunk.split('\n')) {
    const line = rawLine.trimEnd()

    if (!line || line.startsWith(':')) {
      continue
    }

    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim() || 'message'
      continue
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart())
    }
  }

  return {
    event,
    data: dataLines.join('\n').trim()
  }
}

function ensureStreamingAnswer() {
  if (!answer.value) {
    answer.value = {
      provider: 'longcat',
      articleSlug: props.article.slug,
      model: '',
      answer: '',
      generatedAt: new Date().toISOString()
    }
  }

  return answer.value
}

function escapeHtml(value: string) {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;')
}

const renderedAnswerHtml = computed(() => {
  if (!displayedAnswer.value.trim()) {
    return ''
  }

  return (marked.parse(escapeHtml(displayedAnswer.value), {
    breaks: true
  }) as string) || ''
})

function revealAnswerText() {
  if (!import.meta.client) {
    displayedAnswer.value = answer.value?.answer || ''
    return
  }

  if (answerRevealFrame !== null) {
    return
  }

  const step = () => {
    answerRevealFrame = null
    const source = answer.value?.answer || ''

    if (!source || displayedAnswer.value.length >= source.length) {
      return
    }

    const remaining = source.length - displayedAnswer.value.length
    const chunkSize = answerPending.value
      ? Math.min(2, remaining)
      : Math.min(4, remaining)

    displayedAnswer.value = source.slice(0, displayedAnswer.value.length + chunkSize)

    if (displayedAnswer.value.length < (answer.value?.answer || '').length) {
      answerRevealFrame = window.requestAnimationFrame(step)
    }
  }

  answerRevealFrame = window.requestAnimationFrame(step)
}

function handleAnswerStreamEvent(rawChunk: string) {
  const parsed = parseSseChunk(rawChunk)

  if (!parsed.data || parsed.data === '[DONE]') {
    return
  }

  const payload = JSON.parse(parsed.data) as Record<string, string>

  if (parsed.event === 'error') {
    throw new Error(payload.message || '文章问答流返回异常')
  }

  if (parsed.event === 'meta') {
    ensureStreamingAnswer().model = payload.model || ensureStreamingAnswer().model
    return
  }

  if (parsed.event === 'chunk') {
    ensureStreamingAnswer().answer += payload.text || ''
    revealAnswerText()
    return
  }

  if (parsed.event === 'done') {
    const donePayload = payload as unknown as ArticleAiStreamResponse
    const currentAnswer = ensureStreamingAnswer()

    currentAnswer.provider = donePayload.provider || currentAnswer.provider
    currentAnswer.articleSlug = donePayload.articleSlug || currentAnswer.articleSlug
    currentAnswer.model = donePayload.model || currentAnswer.model
    currentAnswer.answer = currentAnswer.answer || donePayload.answer || ''
    currentAnswer.generatedAt = donePayload.generatedAt || currentAnswer.generatedAt
    revealAnswerText()
  }
}

async function askArticle() {
  if (!question.value.trim()) {
    answerError.value = '请输入问题后再发给 AI 阅读助手'
    return
  }

  resetAnswerState()
  answerPending.value = true
  answerError.value = ''
  ensureStreamingAnswer()

  const controller = new AbortController()
  answerStreamController.value = controller

  try {
    const response = await fetch('/api/ai/article-qa-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({
        slug: props.article.slug,
        question: question.value.trim()
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error((await readResponseError(response)) || '文章问答失败')
    }

    const reader = response.body?.getReader()

    if (!reader) {
      throw new Error('流式响应正文缺失')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), {
        stream: !done
      }).replace(/\r\n/gu, '\n')

      let boundaryIndex = buffer.indexOf('\n\n')

      while (boundaryIndex >= 0) {
        const rawChunk = buffer.slice(0, boundaryIndex).trim()
        buffer = buffer.slice(boundaryIndex + 2)

        if (rawChunk) {
          handleAnswerStreamEvent(rawChunk)
        }

        boundaryIndex = buffer.indexOf('\n\n')
      }

      if (done) {
        break
      }
    }

    if (buffer.trim()) {
      handleAnswerStreamEvent(buffer.trim())
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    answerError.value = toErrorMessage(error, '文章问答失败')
  } finally {
    if (answerStreamController.value === controller) {
      answerStreamController.value = null
    }

    answerPending.value = false
  }
}

function applySuggestedQuestion(value: string) {
  question.value = value
}

watch(
  () => answer.value?.answer || '',
  () => {
    revealAnswerText()
  }
)
</script>

<template>
  <AppSurface class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="space-y-2">
        <p class="eyebrow">AI 阅读助手</p>
        <h2 class="panel-title">Longcat 文章协作助手</h2>
        <p class="body-copy">
          不离开文章页面即可生成摘要、解释划词内容，并继续追问实现细节
        </p>
      </div>
      <AppStatusPill :tone="aiReady ? 'success' : 'warning'">
        {{ aiReady ? 'Longcat 已就绪' : '缺少服务密钥' }}
      </AppStatusPill>
    </div>

    <div class="signal-divider" />

    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-start gap-3">
          <Sparkles class="mt-1 size-4 text-accent" />
          <div>
            <p class="text-sm font-medium text-ink-strong">文章摘要</p>
            <p class="body-copy">
              让模型把文章压缩成更易吸收的重点结论与行动建议
            </p>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-line/[0.16] bg-surface-muted/70 px-4 py-2 text-sm text-ink-strong transition hover:border-accent/35 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="summaryPending || !aiReady"
          @click="generateSummary"
        >
          <component :is="summary ? RefreshCcw : Sparkles" class="size-4" />
          {{ summaryPending ? '生成中...' : summary ? '重新生成摘要' : '生成摘要' }}
        </button>
      </div>

      <div
        class="rounded-[1.75rem] border border-line/[0.12] bg-surface-muted/40 p-4 md:p-5"
        role="status"
        aria-live="polite"
        :aria-busy="summaryPending ? 'true' : 'false'"
      >
        <div v-if="summaryPending" class="flex items-start gap-3 text-sm text-ink-soft">
          <LoaderCircle class="mt-1 size-4 animate-spin text-accent" />
          <p class="leading-7">Longcat 正在阅读文章，并压缩成更精炼的摘要</p>
        </div>

        <div v-else-if="summary" class="space-y-4">
          <p class="body-copy">{{ summary.summary }}</p>

          <div v-if="summary.takeaways.length > 0" class="space-y-2">
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">核心要点</p>
            <ul class="space-y-2 text-sm leading-7 text-ink-soft">
              <li v-for="item in summary.takeaways" :key="item" class="flex gap-2">
                <span class="mt-3 inline-block size-1.5 rounded-full bg-accent" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <div v-if="summary.followUps.length > 0" class="space-y-2">
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-warm">可继续追问</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="item in summary.followUps"
                :key="item"
                type="button"
                class="rounded-full border border-line/[0.14] bg-surface px-3 py-2 text-left text-xs leading-6 text-ink-soft transition hover:border-accent/30 hover:text-ink-strong"
                @click="applySuggestedQuestion(item)"
              >
                {{ item }}
              </button>
            </div>
          </div>

          <p class="text-xs text-ink-faint">模型：{{ summary.model }}</p>
        </div>

        <div v-else class="flex items-start gap-3 text-sm text-ink-soft">
          <Bot class="mt-1 size-4 text-accent" />
          <p class="leading-7">
            当你希望先快速理解文章，再深入阅读全文时，可以先生成摘要
          </p>
        </div>
      </div>

      <p v-if="summaryError" class="text-sm text-danger" role="alert" aria-live="polite">{{ summaryError }}</p>
    </div>

    <div class="signal-divider" />

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <Highlighter class="mt-1 size-4 text-accent-warm" />
          <div>
            <p class="text-sm font-medium text-ink-strong">划词解释</p>
            <p class="body-copy">
              在正文中选中一句话或一个概念，让模型结合上下文解释它
            </p>
          </div>
        </div>

        <button
          v-if="selectedTextPreview"
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-line/[0.14] px-3 py-2 text-xs text-ink-soft transition hover:border-accent/30 hover:text-ink-strong"
          @click="emit('clear-selection')"
        >
          <X class="size-3.5" />
          清除选中
        </button>
      </div>

      <div
        class="rounded-[1.75rem] border border-line/[0.12] bg-surface-muted/40 p-4 md:p-5"
        role="status"
        aria-live="polite"
        :aria-busy="explainPending ? 'true' : 'false'"
      >
        <div v-if="selectedTextPreview" class="space-y-4">
          <div class="space-y-2">
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">选中文本</p>
            <p class="body-copy">
              {{ selectedTextPreview }}
            </p>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-line/[0.16] bg-surface px-4 py-2 text-sm text-ink-strong transition hover:border-accent/35 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="explainPending || !aiReady"
            @click="explainSelection"
          >
            <component :is="explainPending ? LoaderCircle : Highlighter" :class="explainPending ? 'size-4 animate-spin' : 'size-4'" />
            {{ explainPending ? '解释中...' : '解释选中文本' }}
          </button>
        </div>

        <div v-else class="flex items-start gap-3 text-sm text-ink-soft">
          <Bot class="mt-1 size-4 text-accent-warm" />
          <p class="leading-7">
            在文章正文中选中任意句子、短语或概念后，这里会提供上下文解释
          </p>
        </div>
      </div>

      <div
        v-if="explainResult"
        class="space-y-4 rounded-[1.75rem] border border-line/[0.12] bg-surface-muted/40 p-4 md:p-5"
        role="status"
        aria-live="polite"
      >
        <p class="body-copy">{{ explainResult.explanation }}</p>

        <div v-if="explainResult.relatedConcepts.length > 0" class="space-y-2">
          <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-warm">相关概念</p>
          <div class="flex flex-wrap gap-2">
            <AppStatusPill v-for="item in explainResult.relatedConcepts" :key="item">
              {{ item }}
            </AppStatusPill>
          </div>
        </div>

        <p class="text-xs text-ink-faint">模型：{{ explainResult.model }}</p>
      </div>

      <p v-if="explainError" class="text-sm text-danger" role="alert" aria-live="polite">{{ explainError }}</p>
    </div>

    <div class="signal-divider" />

    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <MessageSquareText class="mt-1 size-4 text-accent-warm" />
        <div>
          <p class="text-sm font-medium text-ink-strong">继续追问文章</p>
          <p class="body-copy">
            回答会以流式方式逐步返回，并始终限定在当前文章上下文内
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in suggestedQuestions"
          :key="item"
          type="button"
          class="rounded-full border border-line/[0.14] bg-surface px-3 py-2 text-left text-xs leading-6 text-ink-soft transition hover:border-accent/30 hover:text-ink-strong"
          @click="applySuggestedQuestion(item)"
        >
          {{ item }}
        </button>
      </div>

      <label class="grid gap-2" :for="questionFieldId">
        <span class="text-sm font-medium text-ink-strong">问题</span>
        <textarea
          :id="questionFieldId"
          v-model="question"
          rows="4"
          class="min-h-28 rounded-[1.5rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition placeholder:text-ink-faint focus:border-accent/35"
          placeholder="这篇文章里最关键的架构决策是什么？"
          :aria-describedby="questionHintId"
          :aria-controls="answer ? answerPanelId : undefined"
        />
      </label>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p :id="questionHintId" class="text-xs leading-6 text-ink-faint">
          回答会从服务端流式返回，并被约束在当前文章内容范围内
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="answerPending"
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
            @click="stopAnswerStream"
          >
            <X class="size-4" />
            停止输出
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="answerPending || !aiReady || !question.trim()"
            @click="askArticle"
          >
            <component :is="answerPending ? LoaderCircle : SendHorizontal" :class="answerPending ? 'size-4 animate-spin' : 'size-4'" />
            {{ answerPending ? '生成中...' : '发送问题' }}
          </button>
        </div>
      </div>

      <div
        v-if="answer"
        :id="answerPanelId"
        class="panel-scroll space-y-4 rounded-[1.75rem] border border-line/[0.12] bg-surface-muted/40 p-4 md:max-h-[30rem] md:p-5"
        role="status"
        aria-live="polite"
        :aria-busy="answerPending ? 'true' : 'false'"
      >
        <div v-if="answerPending" class="flex items-center gap-2 text-xs text-ink-faint">
          <LoaderCircle class="size-4 animate-spin text-accent" />
          <span>正在逐段接收流式回答...</span>
        </div>

        <div v-if="renderedAnswerHtml" class="space-y-3">
          <div class="ai-stream-content" v-html="renderedAnswerHtml" />
          <div v-if="answerPending" class="flex items-center gap-2 text-xs text-ink-faint">
            <span class="inline-block size-2 rounded-full bg-accent/70 animate-pulse" />
            <span>输出中</span>
          </div>
        </div>
        <p v-else class="body-copy">
          正在等待 Longcat 返回第一段内容...
        </p>

        <p v-if="answer.model" class="text-xs text-ink-faint">模型：{{ answer.model }}</p>
      </div>

      <p v-if="answerError" class="text-sm text-danger" role="alert" aria-live="polite">{{ answerError }}</p>
    </div>
  </AppSurface>
</template>
