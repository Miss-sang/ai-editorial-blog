import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { updateArticle } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'
import type { ArticleEditorPayload } from '~/types/content-studio'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章 ID 不能为空。'
    })
  }

  const body = await readBody<ArticleEditorPayload>(event)
  const article = await updateArticle(id, body)

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应文章。'
    })
  }

  return article
})
