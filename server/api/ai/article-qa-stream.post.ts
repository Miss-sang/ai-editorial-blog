import { createError, createEventStream, defineEventHandler, readBody } from 'h3'
import { streamArticleQuestion } from '~/server/lib/ai-reader'
import { getPublicArticleBySlug } from '~/server/lib/content-studio'
import { recordAiUsage, toTelemetryErrorMessage } from '~/server/lib/telemetry'
import { assertAiRateLimit } from '~/server/utils/ai-rate-limit'

function toErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeError = error as {
      statusMessage?: string
      message?: string
      data?: {
        statusMessage?: string
      }
    }

    return maybeError.statusMessage || maybeError.data?.statusMessage || maybeError.message || ''
  }

  return ''
}

export default defineEventHandler(async (event) => {
  assertAiRateLimit(event, {
    bucket: 'article-qa',
    limit: 18,
    windowMs: 10 * 60 * 1000
  })

  const body = await readBody<{ slug?: string; question?: string }>(event)
  const slug = String(body?.slug || '').trim()
  const question = String(body?.question || '').trim()

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章 slug 不能为空。'
    })
  }

  if (!question) {
    throw createError({
      statusCode: 400,
      statusMessage: '提问内容不能为空。'
    })
  }

  const article = await getPublicArticleBySlug(slug)

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应文章。'
    })
  }

  const eventStream = createEventStream(event)
  const abortController = new AbortController()
  const startedAt = Date.now()

  eventStream.onClosed(async () => {
    abortController.abort()
    await eventStream.close()
  })

  void (async () => {
    try {
      const result = await streamArticleQuestion(article, question, {
        signal: abortController.signal,
        onMeta: async (meta) => {
          await eventStream.push({
            event: 'meta',
            data: JSON.stringify({
              model: meta.model,
              articleSlug: article.slug
            })
          })
        },
        onTextChunk: async (chunk) => {
          await eventStream.push({
            event: 'chunk',
            data: JSON.stringify({
              text: chunk
            })
          })
        }
      })

      await eventStream.push({
        event: 'done',
        data: JSON.stringify(result)
      })

      await recordAiUsage(event, {
        feature: 'article_qa',
        provider: result.provider,
        model: result.model,
        articleSlug: article.slug,
        status: 'SUCCESS',
        promptLength: question.length,
        outputLength: result.answer.length,
        durationMs: Date.now() - startedAt
      })
    } catch (error) {
      if (abortController.signal.aborted) {
        return
      }

      await recordAiUsage(event, {
        feature: 'article_qa',
        provider: 'longcat',
        articleSlug: article.slug,
        status: 'ERROR',
        promptLength: question.length,
        durationMs: Date.now() - startedAt,
        errorMessage: toTelemetryErrorMessage(error)
      })

      await eventStream.push({
        event: 'error',
        data: JSON.stringify({
          message: toErrorMessage(error) || '文章问答流式响应失败。'
        })
      })
    } finally {
      await eventStream.close()
    }
  })()

  return eventStream.send()
})
