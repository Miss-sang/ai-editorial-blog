import { createError, defineEventHandler, readBody } from 'h3'
import { explainArticleSelection } from '~/server/lib/ai-reader'
import { getPublicArticleBySlug } from '~/server/lib/content-studio'
import { recordAiUsage, toTelemetryErrorMessage } from '~/server/lib/telemetry'
import { assertAiRateLimit } from '~/server/utils/ai-rate-limit'

export default defineEventHandler(async (event) => {
  assertAiRateLimit(event, {
    bucket: 'article-explain',
    limit: 20,
    windowMs: 10 * 60 * 1000
  })

  const body = await readBody<{ slug?: string; selection?: string }>(event)
  const slug = String(body?.slug || '').trim()
  const selection = String(body?.selection || '').trim()

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章 slug 不能为空。'
    })
  }

  if (!selection) {
    throw createError({
      statusCode: 400,
      statusMessage: '选中文本不能为空。'
    })
  }

  const article = await getPublicArticleBySlug(slug)

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应文章。'
    })
  }

  const startedAt = Date.now()

  try {
    const response = await explainArticleSelection(article, selection)

    await recordAiUsage(event, {
      feature: 'article_explain',
      provider: response.provider,
      model: response.model,
      articleSlug: article.slug,
      status: 'SUCCESS',
      promptLength: article.bodyMd.length,
      selectionLength: selection.length,
      outputLength: response.explanation.length,
      durationMs: Date.now() - startedAt
    })

    return response
  } catch (error) {
    await recordAiUsage(event, {
      feature: 'article_explain',
      provider: 'longcat',
      articleSlug: slug,
      status: 'ERROR',
      promptLength: article.bodyMd.length,
      selectionLength: selection.length,
      durationMs: Date.now() - startedAt,
      errorMessage: toTelemetryErrorMessage(error)
    })

    throw error
  }
})
