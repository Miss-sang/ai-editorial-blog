import { createError, defineEventHandler, readBody } from 'h3'
import { answerArticleQuestion } from '~/server/lib/ai-reader'
import { getPublicArticleBySlug } from '~/server/lib/content-studio'
import { recordAiUsage, toTelemetryErrorMessage } from '~/server/lib/telemetry'
import { assertAiRateLimit } from '~/server/utils/ai-rate-limit'

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

  const startedAt = Date.now()

  try {
    const response = await answerArticleQuestion(article, question)

    await recordAiUsage(event, {
      feature: 'article_qa',
      provider: response.provider,
      model: response.model,
      articleSlug: article.slug,
      status: 'SUCCESS',
      promptLength: question.length,
      outputLength: response.answer.length,
      durationMs: Date.now() - startedAt
    })

    return response
  } catch (error) {
    await recordAiUsage(event, {
      feature: 'article_qa',
      provider: 'longcat',
      articleSlug: article.slug,
      status: 'ERROR',
      promptLength: question.length,
      durationMs: Date.now() - startedAt,
      errorMessage: toTelemetryErrorMessage(error)
    })

    throw error
  }
})
