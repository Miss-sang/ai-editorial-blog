import type { H3Event } from 'h3'
import { assertRateLimit } from '~/server/utils/rate-limit'

interface RateLimitOptions {
  bucket: string
  limit: number
  windowMs: number
}

export function assertAiRateLimit(event: H3Event, options: RateLimitOptions) {
  assertRateLimit(event, {
    ...options,
    message: ({ retryAfter }) => `AI 请求过于频繁，请在 ${retryAfter} 秒后重试。`
  })
}
