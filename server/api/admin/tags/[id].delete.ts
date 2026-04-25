import { createError, defineEventHandler, getRouterParam } from 'h3'
import { deleteTag } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '标签 ID 不能为空。'
    })
  }

  const deleted = await deleteTag(id)

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应标签。'
    })
  }

  return {
    ok: true
  }
})
