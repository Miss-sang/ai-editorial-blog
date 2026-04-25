import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getPublicTagBySlug } from '~/server/lib/content-studio'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: '标签 slug 不能为空。'
    })
  }

  const tag = await getPublicTagBySlug(slug)

  if (!tag) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应标签。'
    })
  }

  return tag
})
