import { createError, defineEventHandler, readBody } from 'h3'
import {
  isOwnerAdminEmail,
  setAdminSession,
  verifyAdminCredentials
} from '~/server/utils/admin-session'
import { assertRateLimit } from '~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  assertRateLimit(event, {
    bucket: 'admin-login',
    limit: 6,
    windowMs: 10 * 60 * 1000,
    message: ({ retryAfter }) => `登录尝试过于频繁，请在 ${retryAfter} 秒后重试。`
  })

  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = String(body?.email || '')
  const password = String(body?.password || '')

  if (!isOwnerAdminEmail(email)) {
    throw createError({
      statusCode: 403,
      statusMessage: '功能暂未开放',
      data: {
        code: 'OWNER_ONLY_ACCESS',
        message: '暂时无法注册，仅支持博主本人登录后台。'
      }
    })
  }

  if (!verifyAdminCredentials(email, password)) {
    throw createError({
      statusCode: 401,
      statusMessage: '登录信息不正确',
      data: {
        code: 'INVALID_PASSWORD',
        message: '账号已识别，但密码不正确，请重新输入。'
      }
    })
  }

  return setAdminSession(event)
})
