import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAdminSession } from '~/server/utils/admin-session'
import { updateTopic } from '~/server/lib/content-studio'
import type { TopicEditorPayload } from '~/types/content-studio'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '专题 ID 不能为空。'
    })
  }

  const body = await readBody<TopicEditorPayload>(event)
  const topic = await updateTopic(id, body)

  if (!topic) {
    throw createError({
      statusCode: 404,
      statusMessage: '未找到对应专题。'
    })
  }

  return topic
})
