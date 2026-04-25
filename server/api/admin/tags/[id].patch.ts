import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAdminSession } from '~/server/utils/admin-session'
import { updateTag } from '~/server/lib/content-studio'
import type { TagEditorPayload } from '~/types/content-studio'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '标签 ID 不能为空。'
    })
  }

  const body = await readBody<TagEditorPayload>(event)
  const tag = await updateTag(id, body)

  if (!tag) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应标签。'
    })
  }

  return tag
})
