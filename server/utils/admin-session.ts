import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { createError, deleteCookie, getCookie, setCookie } from 'h3'

const COOKIE_NAME = 'axiom_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

interface CookiePayload {
  email: string
  displayName: string
  exp: number
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function getSessionConfig() {
  const config = useRuntimeConfig()

  if (!config.adminSessionSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: '缺少 ADMIN_SESSION_SECRET 配置'
    })
  }

  return {
    secret: config.adminSessionSecret,
    email: String(config.adminLoginEmail || '').trim().toLowerCase(),
    password: String(config.adminLoginPassword || ''),
    displayName: String(config.adminDisplayName || '站点维护者')
  }
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyAdminCredentials(email: string, password: string) {
  const config = getSessionConfig()
  return (
    safeCompare(email.trim().toLowerCase(), config.email) && safeCompare(password, config.password)
  )
}

export function isOwnerAdminEmail(email: string) {
  const config = getSessionConfig()
  return safeCompare(email.trim().toLowerCase(), config.email)
}

export function setAdminSession(event: H3Event) {
  const config = getSessionConfig()
  const payload: CookiePayload = {
    email: config.email,
    displayName: config.displayName,
    exp: Date.now() + COOKIE_MAX_AGE * 1000
  }
  const encoded = toBase64Url(JSON.stringify(payload))
  const signature = signPayload(encoded, config.secret)

  setCookie(event, COOKIE_NAME, `${encoded}.${signature}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: !import.meta.dev,
    maxAge: COOKIE_MAX_AGE
  })

  return {
    authenticated: true,
    email: payload.email,
    displayName: payload.displayName
  }
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, {
    path: '/'
  })
}

export function getAdminSession(event: H3Event) {
  const rawCookie = getCookie(event, COOKIE_NAME)

  if (!rawCookie) {
    return {
      authenticated: false,
      email: null,
      displayName: null
    }
  }

  const [encoded, signature] = rawCookie.split('.')

  if (!encoded || !signature) {
    return {
      authenticated: false,
      email: null,
      displayName: null
    }
  }

  try {
    const config = getSessionConfig()
    const expectedSignature = signPayload(encoded, config.secret)

    if (!safeCompare(signature, expectedSignature)) {
      return {
        authenticated: false,
        email: null,
        displayName: null
      }
    }

    const payload = JSON.parse(fromBase64Url(encoded)) as CookiePayload

    if (payload.exp < Date.now()) {
      return {
        authenticated: false,
        email: null,
        displayName: null
      }
    }

    return {
      authenticated: true,
      email: payload.email,
      displayName: payload.displayName
    }
  } catch {
    return {
      authenticated: false,
      email: null,
      displayName: null
    }
  }
}

export function requireAdminSession(event: H3Event) {
  const session = getAdminSession(event)

  if (!session.authenticated || !session.email) {
    throw createError({
      statusCode: 401,
      statusMessage: '需要先登录后台'
    })
  }

  return session
}
