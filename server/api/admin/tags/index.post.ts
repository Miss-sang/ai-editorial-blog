import { defineEventHandler, readBody } from 'h3'
import { createTag } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'
import type { TagEditorPayload } from '~/types/content-studio'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const body = await readBody<TagEditorPayload>(event)
  return await createTag(body)
})
