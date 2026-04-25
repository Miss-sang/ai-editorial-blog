import { defineEventHandler } from 'h3'
import { getTelemetrySummary } from '~/server/lib/telemetry'
import { requireAdminSession } from '~/server/utils/admin-session'

export default defineEventHandler(async (event) => {
  requireAdminSession(event)
  return await getTelemetrySummary()
})
