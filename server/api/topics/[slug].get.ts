import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getPublicTopicBySlug } from '~/server/lib/content-studio'
import { setPublicContentCacheHeaders } from '~/server/utils/public-cache'

export default defineEventHandler(async (event) => {
  setPublicContentCacheHeaders(event)
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: '专题 slug 不能为空。'
    })
  }

  const topic = await getPublicTopicBySlug(slug)

  if (!topic) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应专题。'
    })
  }

  return topic
})
