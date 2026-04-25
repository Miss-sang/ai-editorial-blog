import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAdminSession } from '~/server/utils/admin-session'
import { updateProject } from '~/server/lib/content-studio'
import type { ProjectEditorPayload } from '~/types/content-studio'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '项目 ID 不能为空。'
    })
  }

  const body = await readBody<ProjectEditorPayload>(event)
  const project = await updateProject(id, body)

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应项目。'
    })
  }

  return project
})
