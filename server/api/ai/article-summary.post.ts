import { createError, defineEventHandler, readBody } from 'h3'
import { generateArticleSummary } from '~/server/lib/ai-reader'
import { getPublicArticleBySlug } from '~/server/lib/content-studio'
import { recordAiUsage, toTelemetryErrorMessage } from '~/server/lib/telemetry'
import { assertAiRateLimit } from '~/server/utils/ai-rate-limit'

export default defineEventHandler(async (event) => {
  assertAiRateLimit(event, {
    bucket: 'article-summary',
    limit: 8,
    windowMs: 10 * 60 * 1000
  })

  const body = await readBody<{ slug?: string }>(event)
  const slug = String(body?.slug || '').trim()

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章 slug 不能为空。'
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
    const response = await generateArticleSummary(article)

    await recordAiUsage(event, {
      feature: 'article_summary',
      provider: response.provider,
      model: response.model,
      articleSlug: article.slug,
      status: 'SUCCESS',
      promptLength: article.bodyMd.length,
      outputLength: response.summary.length,
      durationMs: Date.now() - startedAt
    })

    return response
  } catch (error) {
    await recordAiUsage(event, {
      feature: 'article_summary',
      provider: 'longcat',
      articleSlug: slug,
      status: 'ERROR',
      promptLength: article.bodyMd.length,
      durationMs: Date.now() - startedAt,
      errorMessage: toTelemetryErrorMessage(error)
    })

    throw error
  }
})
