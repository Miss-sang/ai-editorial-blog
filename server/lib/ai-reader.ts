import { createError } from 'h3'
import {
  extractLongcatText,
  getLongcatModels,
  hasLongcatConfig,
  requestLongcatChat,
  requestLongcatChatStream
} from '~/server/lib/longcat'
import type { ArticleRecord } from '~/types/content-studio'
import type {
  ArticleAiAnswerResponse,
  ArticleAiExplainResponse,
  ArticleAiStreamResponse,
  ArticleAiSummaryResponse
} from '~/types/ai-reader'

const ARTICLE_CONTEXT_LIMIT = 12000
const ARTICLE_SELECTION_LIMIT = 800

interface ParsedSseEvent {
  event: string
  data: string
}

interface StreamArticleQuestionOptions {
  signal?: AbortSignal
  onMeta?: (meta: { model: string }) => Promise<void> | void
  onTextChunk?: (chunk: string) => Promise<void> | void
}

function ensureLongcatReady() {
  if (!hasLongcatConfig()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'AI 阅读助手暂未完成配置。'
    })
  }
}

function clipText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength)}\n\n[内容过长，已按 AI 上下文限制截断]`
}

function buildArticleContext(article: ArticleRecord) {
  const outline = (article.bodyMd.match(/^##?\s+(.+)$/gm) || [])
    .map((heading) => heading.replace(/^##?\s+/, '').trim())
    .filter(Boolean)
    .slice(0, 12)

  return [
    `标题：${article.title}`,
    `摘要：${article.summary}`,
    `专题：${article.topic?.name || '通用主题'}`,
    `标签：${article.tags.map((tag) => tag.name).join('、') || '暂无标签'}`,
    outline.length > 0 ? `文章提纲：\n- ${outline.join('\n- ')}` : '文章提纲：暂无',
    '文章 Markdown 正文：',
    clipText(article.bodyMd, ARTICLE_CONTEXT_LIMIT)
  ].join('\n\n')
}

function extractJsonCandidate(value: string) {
  const start = value.indexOf('{')
  const end = value.lastIndexOf('}')

  if (start < 0 || end <= start) {
    return null
  }

  return value.slice(start, end + 1)
}

function parseStructuredPayload<T>(value: string) {
  const candidate = extractJsonCandidate(value)

  if (!candidate) {
    return null
  }

  try {
    return JSON.parse(candidate) as T
  } catch {
    return null
  }
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeStringList(value: unknown, limit = 4) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => normalizeString(item))
    .filter(Boolean)
    .slice(0, limit)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function parseSseEvent(rawEvent: string): ParsedSseEvent {
  let event = 'message'
  const dataLines: string[] = []

  for (const rawLine of rawEvent.split('\n')) {
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

function extractStreamModel(payload: Record<string, unknown>) {
  const message = isRecord(payload.message) ? payload.message : null
  return normalizeString(message?.model) || normalizeString(payload.model)
}

function extractStreamText(payload: Record<string, unknown>) {
  const directDelta = isRecord(payload.delta) ? payload.delta : null

  if (typeof directDelta?.text === 'string') {
    return directDelta.text
  }

  const choices = Array.isArray(payload.choices) ? payload.choices : []
  const firstChoice = isRecord(choices[0]) ? choices[0] : null
  const choiceDelta = firstChoice && isRecord(firstChoice.delta) ? firstChoice.delta : null

  if (typeof choiceDelta?.content === 'string') {
    return choiceDelta.content
  }

  if (Array.isArray(choiceDelta?.content)) {
    return choiceDelta.content
      .map((part) => {
        if (!isRecord(part)) {
          return ''
        }

        return typeof part.text === 'string' ? part.text : ''
      })
      .join('')
  }

  const choiceMessage = firstChoice && isRecord(firstChoice.message) ? firstChoice.message : null

  if (typeof choiceMessage?.content === 'string') {
    return choiceMessage.content
  }

  return ''
}

function extractStreamError(payload: Record<string, unknown>) {
  const error = isRecord(payload.error) ? payload.error : null
  return (
    normalizeString(error?.message) ||
    normalizeString(payload.message) ||
    normalizeString(payload.error)
  )
}

async function consumeLongcatSse(
  response: Response,
  handlers: {
    onMeta?: (meta: { model: string }) => Promise<void> | void
    onText?: (chunk: string) => Promise<void> | void
  }
) {
  const reader = response.body?.getReader()

  if (!reader) {
    throw createError({
      statusCode: 502,
      statusMessage: 'AI 流式响应内容无法读取。'
    })
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
      const rawEvent = buffer.slice(0, boundaryIndex).trim()
      buffer = buffer.slice(boundaryIndex + 2)

      if (rawEvent) {
        const parsedEvent = parseSseEvent(rawEvent)

        if (parsedEvent.data && parsedEvent.data !== '[DONE]') {
          const payload = parseJsonRecord(parsedEvent.data)

          if (!payload) {
            throw createError({
              statusCode: 502,
              statusMessage: 'AI 流式返回的数据格式不正确。'
            })
          }

          const errorMessage = extractStreamError(payload)

          if (parsedEvent.event === 'error' && errorMessage) {
            throw createError({
              statusCode: 502,
              statusMessage: errorMessage
            })
          }

          const model = extractStreamModel(payload)

          if (model) {
            await handlers.onMeta?.({
              model
            })
          }

          const textChunk = extractStreamText(payload)

          if (textChunk) {
            await handlers.onText?.(textChunk)
          }
        }
      }

      boundaryIndex = buffer.indexOf('\n\n')
    }

    if (done) {
      break
    }
  }

  const tailEvent = buffer.trim()

  if (tailEvent) {
    const parsedEvent = parseSseEvent(tailEvent)

    if (parsedEvent.data && parsedEvent.data !== '[DONE]') {
      const payload = parseJsonRecord(parsedEvent.data)

      if (!payload) {
        throw createError({
          statusCode: 502,
          statusMessage: 'AI 流式返回的数据格式不正确。'
        })
      }

      const errorMessage = extractStreamError(payload)

      if (parsedEvent.event === 'error' && errorMessage) {
        throw createError({
          statusCode: 502,
          statusMessage: errorMessage
        })
      }

      const model = extractStreamModel(payload)

      if (model) {
        await handlers.onMeta?.({
          model
        })
      }

      const textChunk = extractStreamText(payload)

      if (textChunk) {
        await handlers.onText?.(textChunk)
      }
    }
  }
}

export async function generateArticleSummary(article: ArticleRecord): Promise<ArticleAiSummaryResponse> {
  ensureLongcatReady()

  const models = getLongcatModels()
  const completion = await requestLongcatChat({
    model: models.chat,
    temperature: 0.35,
    messages: [
      {
        role: 'system',
        content:
          '你是技术博客的 AI 阅读助手。请返回严格 JSON，字段为 summary、takeaways、followUps。summary 需简洁具体，takeaways 与 followUps 必须是简短字符串数组，只能使用文章中明确提供的信息，并以中文输出。'
      },
      {
        role: 'user',
        content: [
          '请为这篇文章生成便于快速阅读的总结。',
          'summary 控制在 120 字以内。',
          'takeaways 应偏向实现与落地经验。',
          '',
          buildArticleContext(article)
        ].join('\n')
      }
    ]
  })

  const rawText = extractLongcatText(completion).trim()

  if (!rawText) {
    throw createError({
      statusCode: 502,
      statusMessage: 'AI 未返回文章摘要内容。'
    })
  }

  const parsed = parseStructuredPayload<{
    summary?: unknown
    takeaways?: unknown
    followUps?: unknown
  }>(rawText)

  return {
    provider: 'longcat',
    articleSlug: article.slug,
    model: completion.model || models.chat,
    summary: normalizeString(parsed?.summary) || rawText,
    takeaways: normalizeStringList(parsed?.takeaways),
    followUps: normalizeStringList(parsed?.followUps),
    generatedAt: new Date().toISOString()
  }
}

export async function answerArticleQuestion(
  article: ArticleRecord,
  question: string
): Promise<ArticleAiAnswerResponse> {
  ensureLongcatReady()

  const trimmedQuestion = question.trim()

  if (trimmedQuestion.length < 4) {
    throw createError({
      statusCode: 400,
      statusMessage: '问题过短，请补充更具体的问题。'
    })
  }

  const models = getLongcatModels()
  const completion = await requestLongcatChat({
    model: models.reasoning,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          '你是文章阅读助手。只能基于提供的文章上下文作答；如果文章没有覆盖问题中的某一部分，要明确说明。请返回严格 JSON，字段为 answer、supportingPoints、followUps，且内容使用中文。'
      },
      {
        role: 'user',
        content: [`问题：${trimmedQuestion}`, '', buildArticleContext(article)].join('\n')
      }
    ]
  })

  const rawText = extractLongcatText(completion).trim()

  if (!rawText) {
    throw createError({
      statusCode: 502,
      statusMessage: 'AI 未返回问题答案。'
    })
  }

  const parsed = parseStructuredPayload<{
    answer?: unknown
    supportingPoints?: unknown
    followUps?: unknown
  }>(rawText)

  return {
    provider: 'longcat',
    articleSlug: article.slug,
    model: completion.model || models.reasoning,
    answer: normalizeString(parsed?.answer) || rawText,
    supportingPoints: normalizeStringList(parsed?.supportingPoints),
    followUps: normalizeStringList(parsed?.followUps),
    generatedAt: new Date().toISOString()
  }
}

export async function explainArticleSelection(
  article: ArticleRecord,
  selection: string
): Promise<ArticleAiExplainResponse> {
  ensureLongcatReady()

  const trimmedSelection = selection.replace(/\s+/gu, ' ').trim()

  if (trimmedSelection.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: '选中文本过短，请选择更完整的内容后再解释。'
    })
  }

  const models = getLongcatModels()
  const completion = await requestLongcatChat({
    model: models.chat,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          '你负责解释技术文章中的选中文本。请返回严格 JSON，字段为 explanation 和 relatedConcepts，内容需简洁具体，且只能使用文章上下文支持的信息，并以中文输出。'
      },
      {
        role: 'user',
        content: [
          '请结合文章上下文解释下面这段选中文本。',
          `选中文本："""${clipText(trimmedSelection, ARTICLE_SELECTION_LIMIT)}"""`,
          '',
          buildArticleContext(article)
        ].join('\n')
      }
    ]
  })

  const rawText = extractLongcatText(completion).trim()

  if (!rawText) {
    throw createError({
      statusCode: 502,
      statusMessage: 'AI 未返回解释内容。'
    })
  }

  const parsed = parseStructuredPayload<{
    explanation?: unknown
    relatedConcepts?: unknown
  }>(rawText)

  return {
    provider: 'longcat',
    articleSlug: article.slug,
    model: completion.model || models.chat,
    selection: clipText(trimmedSelection, ARTICLE_SELECTION_LIMIT),
    explanation: normalizeString(parsed?.explanation) || rawText,
    relatedConcepts: normalizeStringList(parsed?.relatedConcepts),
    generatedAt: new Date().toISOString()
  }
}

export async function streamArticleQuestion(
  article: ArticleRecord,
  question: string,
  options: StreamArticleQuestionOptions = {}
): Promise<ArticleAiStreamResponse> {
  ensureLongcatReady()

  const trimmedQuestion = question.trim()

  if (trimmedQuestion.length < 4) {
    throw createError({
      statusCode: 400,
      statusMessage: '问题过短，请补充更具体的问题。'
    })
  }

  const models = getLongcatModels()
  let model = models.reasoning
  let answer = ''

  const response = await requestLongcatChatStream(
    {
      model: models.reasoning,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            '你是文章阅读助手。只能基于提供的文章上下文作答；如果文章没有覆盖问题中的某一部分，要明确说明。请用中文 Markdown 简洁回答，可使用短段落或短列表。'
        },
        {
          role: 'user',
          content: [`问题：${trimmedQuestion}`, '', buildArticleContext(article)].join('\n')
        }
      ]
    },
    {
      signal: options.signal
    }
  )

  await consumeLongcatSse(response, {
    onMeta: async (meta) => {
      model = meta.model || model
      await options.onMeta?.({
        model
      })
    },
    onText: async (chunk) => {
      answer += chunk
      await options.onTextChunk?.(chunk)
    }
  })

  const normalizedAnswer = answer.trim()

  if (!normalizedAnswer) {
    throw createError({
      statusCode: 502,
      statusMessage: 'AI 未返回流式答案内容。'
    })
  }

  return {
    provider: 'longcat',
    articleSlug: article.slug,
    model,
    answer: normalizedAnswer,
    generatedAt: new Date().toISOString()
  }
}
