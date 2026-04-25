import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { createClient } from '@supabase/supabase-js'

const cwd = process.cwd()
const envFilePath = join(cwd, '.env')
const LOG_PREFIX = '[stack-check]'

function log(message) {
  console.log(`${LOG_PREFIX} ${message}`)
}

function toErrorMessage(error) {
  return error instanceof Error
    ? error.cause instanceof Error
      ? `${error.message}: ${error.cause.message}`
      : error.message
    : String(error)
}

function createChildEnv() {
  const source = {
    ...process.env,
    NUXT_TELEMETRY_DISABLED: process.env.NUXT_TELEMETRY_DISABLED || '1'
  }

  if (process.platform !== 'win32') {
    return source
  }

  const normalized = {}
  const seenKeys = new Map()

  for (const [rawKey, rawValue] of Object.entries(source)) {
    if (!rawKey || rawValue == null) {
      continue
    }

    if (rawKey.startsWith('=') || rawKey.startsWith('BASH_FUNC_')) {
      continue
    }

    const lowerKey = rawKey.toLowerCase()
    const normalizedKey = lowerKey === 'path' ? 'Path' : rawKey
    const existingKey = seenKeys.get(lowerKey)

    if (existingKey) {
      delete normalized[existingKey]
    }

    seenKeys.set(lowerKey, normalizedKey)
    normalized[normalizedKey] = String(rawValue)
  }

  return normalized
}

function parseEnvFile(raw) {
  const values = {}

  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    values[key] = value
  }

  return values
}

async function loadLocalEnv() {
  try {
    const raw = await readFile(envFilePath, 'utf8')
    return parseEnvFile(raw)
  } catch {
    return {}
  }
}

function createCookieJar() {
  let cookie = ''

  return {
    apply(headers = {}) {
      if (!cookie) {
        return headers
      }

      return {
        ...headers,
        cookie
      }
    },
    update(response) {
      const getSetCookie =
        typeof response.headers.getSetCookie === 'function'
          ? response.headers.getSetCookie.bind(response.headers)
          : null

      const rawCookies = getSetCookie?.() ?? []

      if (!rawCookies.length) {
        const headerValue = response.headers.get('set-cookie')

        if (!headerValue) {
          return
        }

        cookie = headerValue.split(';', 1)[0]
        return
      }

      cookie = rawCookies.map((value) => value.split(';', 1)[0]).join('; ')
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function buildBaseUrlCandidates(baseUrl) {
  const candidates = [baseUrl]

  try {
    const url = new URL(baseUrl)

    if (url.hostname === '127.0.0.1') {
      candidates.push(baseUrl.replace('127.0.0.1', 'localhost'))
      candidates.push(baseUrl.replace('127.0.0.1', '[::1]'))
    } else if (url.hostname === 'localhost') {
      candidates.push(baseUrl.replace('localhost', '127.0.0.1'))
      candidates.push(baseUrl.replace('localhost', '[::1]'))
    } else if (url.hostname === '::1' || url.hostname === '[::1]') {
      candidates.push(baseUrl.replace(/\[?::1\]?/u, 'localhost'))
      candidates.push(baseUrl.replace(/\[?::1\]?/u, '127.0.0.1'))
    }
  } catch {
    return candidates
  }

  return [...new Set(candidates)]
}

async function probeBaseUrl(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/system/status`, {
      signal: AbortSignal.timeout(4000)
    })

    if (!response.ok) {
      return {
        ok: false,
        message: `HTTP ${response.status}`
      }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      message: toErrorMessage(error)
    }
  }
}

async function resolveReachableBaseUrl(baseUrl) {
  const candidates = buildBaseUrlCandidates(baseUrl)

  for (const candidate of candidates) {
    log(`Probing ${candidate}/api/system/status`)
    const result = await probeBaseUrl(candidate)

    if (result.ok) {
      if (candidate !== baseUrl) {
        log(`Base URL fallback applied: ${baseUrl} -> ${candidate}`)
      }

      return candidate
    }

    log(`Probe failed for ${candidate}: ${result.message}`)
  }

  throw new Error(
    `Unable to reach Nuxt server via any loopback address. Tried: ${candidates.join(', ')}`
  )
}

async function waitForServer(baseUrl, child, options = {}) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Nuxt exited early with code ${child.exitCode}`)
    }

    try {
      const response = await fetch(`${baseUrl}/api/system/status`)

      if (response.ok) {
        return
      }
    } catch {
      // Server is still starting.
    }

    if (attempt === 0) {
      log(`Waiting for Nuxt dev server at ${baseUrl} ...`)
    } else if ((attempt + 1) % 5 === 0) {
      log(`Still waiting for ${baseUrl} (${attempt + 1}s elapsed) ...`)
    }

    if (attempt === 4) {
      options.onSlowStart?.()
    }

    await delay(1000)
  }

  throw new Error('Timed out waiting for Nuxt dev server')
}

function startNuxtDevServer(baseUrl, port) {
  const childEnv = createChildEnv()
  const child =
    process.platform === 'win32'
      ? spawn(
          process.execPath,
          [
            join(cwd, 'scripts', 'run-with-realpath-patch.cjs'),
            join(cwd, 'scripts', 'run-nuxt-cli.cjs'),
            'dev',
            '--port',
            String(port),
            '--host',
            '127.0.0.1'
          ],
          {
            cwd,
            env: childEnv,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
          }
        )
      : spawn(
          'npm',
          ['run', 'dev', '--', '--port', String(port), '--host', '127.0.0.1'],
          {
            cwd,
            env: childEnv,
            stdio: ['ignore', 'pipe', 'pipe']
          }
        )

  let output = ''
  let mirrorOutput = process.env.STACK_CHECK_DEBUG === '1'

  function flushBufferedOutput() {
    const details = output.trim()

    if (!details) {
      return
    }

    process.stdout.write(`[stack-check:nuxt]\n${details}\n`)
  }

  function enableMirroring() {
    if (mirrorOutput) {
      return
    }

    mirrorOutput = true
    log('Nuxt startup is taking longer than expected. Streaming child output ...')
    flushBufferedOutput()
  }

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    output += text

    if (mirrorOutput) {
      process.stdout.write(`[stack-check:nuxt] ${text}`)
    }
  })
  child.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    output += text

    if (mirrorOutput) {
      process.stderr.write(`[stack-check:nuxt] ${text}`)
    }
  })

  return {
    child,
    baseUrl,
    async ready() {
      try {
        await waitForServer(baseUrl, child, {
          onSlowStart: enableMirroring
        })
      } catch (error) {
        const details = output.trim()
        throw new Error(
          details
            ? `${error instanceof Error ? error.message : 'Nuxt start failed'}\n\n${details}`
            : error instanceof Error
              ? error.message
              : 'Nuxt start failed'
        )
      }
    },
    async stop() {
      if (child.exitCode !== null) {
        return
      }

      child.kill('SIGTERM')

      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (child.exitCode !== null) {
          return
        }

        await delay(250)
      }

      child.kill('SIGKILL')
    }
  }
}

async function main() {
  const fileEnv = await loadLocalEnv()
  const env = {
    ...fileEnv,
    ...process.env
  }

  const verifyPort = Number(env.VERIFY_PORT || 3010)
  const requestedBaseUrl = String(env.VERIFY_BASE_URL || `http://127.0.0.1:${verifyPort}`)
  const adminEmail = String(env.ADMIN_LOGIN_EMAIL || 'admin@axiom-notes.dev')
  const adminPassword = String(env.ADMIN_LOGIN_PASSWORD || 'change-me-please')
  const supabaseUrl = String(
    env.NUXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || ''
  )
  const supabaseServiceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || '')
  const supabaseStorageBucket = String(env.SUPABASE_STORAGE_BUCKET || '')

  const cookieJar = createCookieJar()
  const created = {
    topicId: '',
    tagId: '',
    articleId: '',
    articleSlug: '',
    uploadPath: ''
  }

  const timestamp = Date.now()
  const uniqueSuffix = `${timestamp}-${Math.random().toString(36).slice(2, 8)}`
  const topicName = `AI Infra ${uniqueSuffix}`
  const tagName = `Smoke ${uniqueSuffix}`
  const articleSlug = `supabase-cutover-check-${uniqueSuffix}`
  const articleTitle = `Supabase Cutover Check ${uniqueSuffix}`

  let server = env.VERIFY_BASE_URL ? null : startNuxtDevServer(requestedBaseUrl, verifyPort)
  let activeBaseUrl = requestedBaseUrl

  async function request(path, options = {}) {
    const headers = cookieJar.apply(options.headers)
    let response

    try {
      response = await fetch(`${activeBaseUrl}${path}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(15000)
      })
    } catch (error) {
      throw new Error(`Network request failed for ${activeBaseUrl}${path}: ${toErrorMessage(error)}`)
    }

    cookieJar.update(response)

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`${options.method || 'GET'} ${path} failed with ${response.status}: ${body}`)
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      return await response.json()
    }

    return await response.text()
  }

  async function cleanup() {
    if (created.articleId) {
      await request(`/api/admin/articles/${created.articleId}`, {
        method: 'DELETE'
      }).catch(() => null)
    }

    if (created.topicId) {
      await request(`/api/admin/topics/${created.topicId}`, {
        method: 'DELETE'
      }).catch(() => null)
    }

    if (created.tagId) {
      await request(`/api/admin/tags/${created.tagId}`, {
        method: 'DELETE'
      }).catch(() => null)
    }

    if (
      created.uploadPath &&
      supabaseUrl &&
      supabaseServiceRoleKey &&
      supabaseStorageBucket
    ) {
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })

      await supabase.storage.from(supabaseStorageBucket).remove([created.uploadPath]).catch(() => null)
    }
  }

  try {
    if (server) {
      log(`Starting temporary Nuxt dev server on ${requestedBaseUrl}`)
      await server.ready()
      log('Temporary Nuxt dev server is ready')
      activeBaseUrl = await resolveReachableBaseUrl(requestedBaseUrl)
    } else {
      log(`Using existing Nuxt server at ${requestedBaseUrl}`)

      try {
        activeBaseUrl = await resolveReachableBaseUrl(requestedBaseUrl)
      } catch (error) {
        const fallbackBaseUrl = `http://127.0.0.1:${verifyPort}`
        log(`Existing Nuxt server is unreachable: ${toErrorMessage(error)}`)
        log(`Falling back to temporary Nuxt dev server on ${fallbackBaseUrl}`)

        server = startNuxtDevServer(fallbackBaseUrl, verifyPort)
        await server.ready()
        log('Temporary Nuxt dev server is ready')
        activeBaseUrl = await resolveReachableBaseUrl(fallbackBaseUrl)
      }
    }

    log('Checking system bootstrap status')
    const systemStatus = await request('/api/system/status')
    assert(systemStatus.status === 'ok', 'System status endpoint did not return ok')
    assert(systemStatus.services.supabasePublic, 'Supabase public env is not active')
    assert(systemStatus.services.supabaseServiceRole, 'Supabase service role env is not active')
    assert(systemStatus.services.supabaseStorage, 'Supabase storage env is not active')

    log('Logging into admin session')
    const loginResponse = await request('/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    })

    assert(loginResponse.authenticated === true, 'Admin login did not create a session')

    log('Confirming admin session')
    const session = await request('/api/admin/auth/session')
    assert(session.authenticated === true, 'Admin session check failed after login')

    log('Capturing baseline dashboard stats')
    const baselineDashboard = await request('/api/admin/dashboard')

    log('Creating temporary topic')
    const topic = await request('/api/admin/topics', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: topicName,
        description: 'Temporary topic used by the real-stack verification script.'
      })
    })

    created.topicId = topic.id

    log('Creating temporary tag')
    const tag = await request('/api/admin/tags', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: tagName,
        color: '#0ea5e9'
      })
    })

    created.tagId = tag.id

    const coverBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMB9oNcamQAAAAASUVORK5CYII=',
      'base64'
    )
    const formData = new FormData()
    formData.append('file', new Blob([coverBuffer], { type: 'image/png' }), 'cover-check.png')

    log('Uploading temporary cover image to Supabase storage')
    const upload = await request('/api/admin/uploads/cover', {
      method: 'POST',
      body: formData
    })

    assert(upload.provider === 'supabase', 'Cover upload did not use Supabase storage')
    assert(typeof upload.url === 'string' && upload.url.startsWith('http'), 'Upload URL is invalid')
    created.uploadPath = upload.path

    log('Creating temporary article through admin API')
    const article = await request('/api/admin/articles', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: articleTitle,
        slug: articleSlug,
        summary: 'Temporary article used by the end-to-end real stack verification script.',
        excerpt: 'Verifies Prisma writes, admin session handling, and Supabase cover upload.',
        bodyMd: '# Real stack check\n\nThis is a temporary article generated by the verification script.',
        coverImageUrl: upload.url,
        status: 'DRAFT',
        isFeatured: false,
        topicName,
        tagNames: [tagName],
        seoTitle: articleTitle,
        seoDescription: 'Temporary SEO description for the real stack verification script.'
      })
    })

    created.articleId = article.id
    created.articleSlug = article.slug
    assert(article.coverImageUrl === upload.url, 'Created article did not store the uploaded cover URL')

    log('Reading article from admin API')
    const adminArticle = await request(`/api/admin/articles/${created.articleId}`)
    assert(adminArticle.id === created.articleId, 'Admin article lookup failed')

    log('Publishing temporary article')
    const publishedArticle = await request(`/api/admin/articles/${created.articleId}/status`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        action: 'PUBLISH'
      })
    })

    assert(publishedArticle.status === 'PUBLISHED', 'Article publish action failed')

    log('Verifying public article endpoint')
    const publicArticle = await request(`/api/articles/${created.articleSlug}`)
    assert(publicArticle.slug === created.articleSlug, 'Public article endpoint did not return the published article')

    log('Verifying admin dashboard response')
    const dashboard = await request('/api/admin/dashboard')
    const articleVisibleInDashboard = Array.isArray(dashboard.recentArticles)
      ? dashboard.recentArticles.some((item) => item.id === created.articleId)
      : false
    assert(
      Number(dashboard.stats.totalArticles || 0) === Number(baselineDashboard.stats.totalArticles || 0) + 1,
      'Admin dashboard total article count did not increment after article creation'
    )
    assert(
      Number(dashboard.stats.publishedArticles || 0) ===
        Number(baselineDashboard.stats.publishedArticles || 0) + 1,
      'Admin dashboard published article count did not increment after publish'
    )
    assert(
      Number(dashboard.stats.topicCount || 0) === Number(baselineDashboard.stats.topicCount || 0) + 1,
      'Admin dashboard topic count did not increment after topic creation'
    )
    assert(
      Number(dashboard.stats.tagCount || 0) === Number(baselineDashboard.stats.tagCount || 0) + 1,
      'Admin dashboard tag count did not increment after tag creation'
    )

    log('All checks passed, cleaning up temporary data')
    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl: activeBaseUrl,
          checks: {
            systemStatus: true,
            adminLogin: true,
            topicCreate: true,
            tagCreate: true,
            coverUpload: true,
            articleCreate: true,
            articlePublish: true,
            publicArticleRead: true,
            dashboardRead: true
          },
          dashboard: {
            recentArticleIncluded: articleVisibleInDashboard,
            baselineStats: baselineDashboard.stats,
            currentStats: dashboard.stats
          },
          created
        },
        null,
        2
      )
    )
  } finally {
    log('Cleaning up temporary verification records')
    await cleanup().catch(() => null)

    if (server) {
      log('Stopping temporary Nuxt dev server')
      await server.stop()
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
