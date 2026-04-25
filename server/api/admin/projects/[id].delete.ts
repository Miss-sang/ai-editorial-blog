import { createError, defineEventHandler, getRouterParam } from 'h3'
import { deleteProject } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '项目 ID 不能为空。'
    })
  }

  const deleted = await deleteProject(id)

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应项目。'
    })
  }

  return {
    ok: true
  }
})
