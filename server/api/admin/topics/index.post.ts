import { defineEventHandler, readBody } from 'h3'
import { createTopic } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'
import type { TopicEditorPayload } from '~/types/content-studio'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const body = await readBody<TopicEditorPayload>(event)
  return await createTopic(body)
})
