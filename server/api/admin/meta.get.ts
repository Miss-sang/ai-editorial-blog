import { defineEventHandler } from 'h3'
import { listAdminTags, listAdminTopics } from '~/server/lib/content-studio'
import { articleStatusOptions } from '~/types/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const [topics, tags] = await Promise.all([listAdminTopics(), listAdminTags()])

  return {
    topics,
    tags,
    statuses: articleStatusOptions
  }
})
