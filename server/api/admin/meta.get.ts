import { defineEventHandler } from 'h3'
import { getContentDashboard } from '~/server/lib/content-studio'
import { articleStatusOptions } from '~/types/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  const dashboard = await getContentDashboard()

  return {
    topics: dashboard.topics,
    tags: dashboard.tags,
    statuses: articleStatusOptions
  }
})
