import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getPublicArticleBySlug, listRelatedArticles } from '~/server/lib/content-studio'
import { setPublicContentCacheHeaders } from '~/server/utils/public-cache'

export default defineEventHandler(async (event) => {
  setPublicContentCacheHeaders(event)
  const slug = getRouterParam(event, 'slug')

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

  return await listRelatedArticles(slug)
})
