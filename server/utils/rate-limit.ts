import type { H3Event } from 'h3'
import { createError, getRequestIP } from 'h3'

export interface RateLimitOptions {
  bucket: string
  limit: number
  windowMs: number
  message?: string | ((context: { retryAfter: number }) => string)
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const globalForRateLimit = globalThis as {
  routeRateLimitStore?: Map<string, RateLimitEntry>
}

function getRateLimitStore() {
  if (!globalForRateLimit.routeRateLimitStore) {
    globalForRateLimit.routeRateLimitStore = new Map<string, RateLimitEntry>()
  }

  return globalForRateLimit.routeRateLimitStore
}

export function getClientFingerprint(event: H3Event) {
  return (
    getRequestIP(event, {
      xForwardedFor: true
    }) ||
    event.node.req.socket.remoteAddress ||
    'local'
  )
}

export function assertRateLimit(event: H3Event, options: RateLimitOptions) {
  const now = Date.now()
  const store = getRateLimitStore()
  const key = `${options.bucket}:${getClientFingerprint(event)}`
  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs
    })
    return
  }

  if (existing.count >= options.limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    const statusMessage =
      typeof options.message === 'function'
        ? options.message({
            retryAfter
          })
        : options.message || `Rate limit exceeded. Try again in ${retryAfter}s.`

    throw createError({
      statusCode: 429,
      statusMessage
    })
  }

  existing.count += 1
  store.set(key, existing)
}
