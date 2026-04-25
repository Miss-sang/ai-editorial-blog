import { createError } from 'h3'
import { assertServerSecret } from '~/server/utils/env'

export interface LongcatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LongcatChatPayload {
  model: string
  messages: LongcatMessage[]
  temperature?: number
  stream?: boolean
}

interface LongcatRequestTarget {
  baseURL: string
  path: string
}

export interface LongcatChatContentPart {
  type?: 'text'
  text?: string
}

export interface LongcatChatCompletionResponse {
  id?: string
  model?: string
  choices?: Array<{
    index?: number
    finish_reason?: string | null
    message?: {
      role?: 'assistant'
      content?: string | LongcatChatContentPart[] | null
    }
  }>
}

export function hasLongcatConfig() {
  const config = useRuntimeConfig()
  return Boolean(config.longcatApiKey)
}

export function getLongcatModels() {
  const config = useRuntimeConfig()

  return {
    chat: String(config.longcatChatModel || 'LongCat-Flash-Chat'),
    reasoning: String(config.longcatReasoningModel || config.longcatChatModel || 'LongCat-Flash-Thinking')
  }
}

function resolveLongcatRequestTarget(rawBaseUrl: string) {
  const fallback: LongcatRequestTarget = {
    baseURL: 'https://api.longcat.chat/openai',
    path: '/v1/chat/completions'
  }

  const normalized = String(rawBaseUrl || '').trim().replace(/\/+$/u, '')

  if (!normalized) {
    return fallback
  }

  try {
    const url = new URL(normalized)
    const host = url.host.toLowerCase()
    const pathname = url.pathname.replace(/\/+$/u, '')

    if (host === 'longcat.chat' && pathname === '/api/openai/v1') {
      return fallback
    }

    if (host === 'api.longcat.chat') {
      if (!pathname || pathname === '/') {
        return {
          baseURL: 'https://api.longcat.chat',
          path: '/openai/v1/chat/completions'
        }
      }

      if (pathname === '/openai') {
        return {
          baseURL: 'https://api.longcat.chat/openai',
          path: '/v1/chat/completions'
        }
      }

      if (pathname === '/openai/v1') {
        return {
          baseURL: 'https://api.longcat.chat/openai',
          path: '/v1/chat/completions'
        }
      }
    }
  } catch {
    return {
      baseURL: normalized,
      path: '/v1/chat/completions'
    }
  }

  return {
    baseURL: normalized,
    path: normalized.endsWith('/openai') ? '/v1/chat/completions' : '/chat/completions'
  }
}

function buildLongcatRequestUrl(target: LongcatRequestTarget) {
  return `${target.baseURL.replace(/\/+$/u, '')}${target.path}`
}

async function throwLongcatHttpError(response: Response) {
  if (response.status === 404) {
    throw createError({
      statusCode: 502,
      statusMessage:
        'Longcat 接口返回 404，请将 LONGCAT_BASE_URL 配置为 https://api.longcat.chat/openai。'
    })
  }

  if (response.status === 401 || response.status === 403) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Longcat API Key 校验失败，请检查 LONGCAT_API_KEY 与剩余额度。'
    })
  }

  const responseText = (await response.text()).trim()

  throw createError({
    statusCode: 502,
    statusMessage: responseText || `Longcat 请求失败，状态码：${response.status}。`
  })
}

function normalizeMessageContent(content: string | LongcatChatContentPart[] | null | undefined) {
  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return ''
  }

  return content
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim()
}

export function extractLongcatText(response: LongcatChatCompletionResponse) {
  return normalizeMessageContent(response.choices?.[0]?.message?.content)
}

export async function requestLongcatChat(payload: LongcatChatPayload) {
  const config = useRuntimeConfig()
  const apiKey = assertServerSecret(config.longcatApiKey, 'LONGCAT_API_KEY')
  const target = resolveLongcatRequestTarget(String(config.longcatBaseUrl || ''))

  try {
    return (await $fetch(target.path, {
      method: 'POST',
      baseURL: target.baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: payload
    })) as LongcatChatCompletionResponse
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      (error as { statusCode?: unknown }).statusCode === 404
    ) {
      throw createError({
        statusCode: 502,
        statusMessage:
          'Longcat 接口返回 404，请将 LONGCAT_BASE_URL 配置为 https://api.longcat.chat/openai。'
      })
    }

    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      ((error as { statusCode?: unknown }).statusCode === 401 ||
        (error as { statusCode?: unknown }).statusCode === 403)
    ) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Longcat API Key 校验失败，请检查 LONGCAT_API_KEY 与剩余额度。'
      })
    }

    throw error
  }
}

export async function requestLongcatChatStream(
  payload: LongcatChatPayload,
  options: {
    signal?: AbortSignal
  } = {}
) {
  const config = useRuntimeConfig()
  const apiKey = assertServerSecret(config.longcatApiKey, 'LONGCAT_API_KEY')
  const target = resolveLongcatRequestTarget(String(config.longcatBaseUrl || ''))

  const response = await fetch(buildLongcatRequestUrl(target), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...payload,
      stream: true
    }),
    signal: options.signal
  })

  if (!response.ok) {
    await throwLongcatHttpError(response)
  }

  if (!response.body) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Longcat 未返回可读取的流式响应内容。'
    })
  }

  return response
}
