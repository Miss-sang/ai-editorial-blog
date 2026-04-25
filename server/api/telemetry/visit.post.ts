import { createError, defineEventHandler, readBody } from 'h3'
import { recordPageVisit } from '~/server/lib/telemetry'
import { assertRateLimit } from '~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, {
    bucket: 'page-visit',
    limit: 180,
    windowMs: 10 * 60 * 1000,
    message: ({ retryAfter }) => `访问统计过于频繁，请在 ${retryAfter} 秒后重试。`
  })

  const body = await readBody<{ path?: string; referrer?: string }>(event)
  const path = String(body?.path || '').trim()

  if (!path.startsWith('/')) {
    throw createError({
      statusCode: 400,
      statusMessage: '访问路径必须以 “/” 开头。'
    })
  }

  if (path.startsWith('/admin')) {
    return {
      ok: true
    }
  }

  await recordPageVisit(event, {
    path,
    referrer: String(body?.referrer || '').trim() || null
  })

  return {
    ok: true
  }
})
