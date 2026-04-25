import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAdminArticleById } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '文章 ID 不能为空。'
    })
  }

  const article = await getAdminArticleById(id)

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应文章。'
    })
  }

  return article
})
