import { defineEventHandler, readBody } from 'h3'
import { createArticle } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'
import type { ArticleEditorPayload } from '~/types/content-studio'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const body = await readBody<ArticleEditorPayload>(event)
  return await createArticle(body)
})
