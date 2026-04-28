import { createError, defineEventHandler, getQuery, getRouterParam, readBody } from 'h3'
import { toCompactAdminArticle, updateArticleStatus } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'
import type { ArticleStatusActionPayload } from '~/types/content-studio'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章 ID 不能为空。'
    })
  }

  const body = await readBody<ArticleStatusActionPayload>(event)
  const article = await updateArticleStatus(id, body.action)

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应文章。'
    })
  }

  return getQuery(event).compact === '1' ? toCompactAdminArticle(article) : article
})
