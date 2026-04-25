import { defineEventHandler } from 'h3'
import { getContentDashboard } from '~/server/lib/content-studio'
import { requireAdminSession } from '~/server/utils/admin-session'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  return await getContentDashboard({
    allowFallback: false
  })
})
