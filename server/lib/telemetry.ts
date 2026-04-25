import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { H3Event } from 'h3'
import { getCookie, getHeader } from 'h3'
import { getPrismaClient } from '~/server/lib/prisma'
import { getClientFingerprint } from '~/server/utils/rate-limit'
import type { TelemetrySummaryResponse } from '~/types/telemetry'

interface StoredPageVisitLog {
  id: string
  path: string
  sessionId: string | null
  referrer: string | null
  userAgent: string | null
  ipHash: string | null
  source: string
  createdAt: string
}

interface StoredSearchLog {
  id: string
  query: string
  normalizedQuery: string
  resultCount: number
  sessionId: string | null
  referrer: string | null
  userAgent: string | null
  ipHash: string | null
  createdAt: string
}

interface StoredAiUsageLog {
  id: string
  feature: string
  provider: string
  model: string | null
  articleSlug: string | null
  status: string
  promptLength: number | null
  selectionLength: number | null
  outputLength: number | null
  durationMs: number | null
  errorMessage: string | null
  sessionId: string | null
  userAgent: string | null
  ipHash: string | null
  createdAt: string
}

interface StoredTelemetryState {
  pageVisits: StoredPageVisitLog[]
  searches: StoredSearchLog[]
  aiUsage: StoredAiUsageLog[]
}

interface TelemetryPrismaClient {
  pageVisitLog?: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>
    findMany(args?: Record<string, unknown>): Promise<Record<string, unknown>[]>
  }
  searchLog?: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>
    findMany(args?: Record<string, unknown>): Promise<Record<string, unknown>[]>
  }
  aiUsageLog?: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>
    findMany(args?: Record<string, unknown>): Promise<Record<string, unknown>[]>
  }
}

interface TelemetryContext {
  sessionId: string | null
  referrer: string | null
  userAgent: string | null
  ipHash: string | null
}

interface RecordPageVisitInput {
  path: string
  referrer?: string | null
  source?: string
}

interface RecordSearchInput {
  query: string
  resultCount: number
}

interface RecordAiUsageInput {
  feature: string
  provider?: string
  model?: string | null
  articleSlug?: string | null
  status: string
  promptLength?: number | null
  selectionLength?: number | null
  outputLength?: number | null
  durationMs?: number | null
  errorMessage?: string | null
}

const TELEMETRY_STORE_PATH = join(process.cwd(), '.data', 'telemetry.json')
const LOOKBACK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

function normalizeNullableString(value: unknown, limit = 400) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized ? normalized.slice(0, limit) : null
}

function normalizeRequiredString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function normalizeInteger(value: unknown) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function normalizeNullableInteger(value: unknown) {
  return Number.isFinite(Number(value)) ? Number(value) : null
}

function normalizeTimestamp(value: unknown, fallback: string) {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value !== 'string') {
    return fallback
  }

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString()
}

function buildEmptyTelemetryState(): StoredTelemetryState {
  return {
    pageVisits: [],
    searches: [],
    aiUsage: []
  }
}

function hydrateTelemetryState(raw: Partial<StoredTelemetryState>) {
  const now = new Date().toISOString()

  return {
    pageVisits: Array.isArray(raw.pageVisits)
      ? raw.pageVisits.map((item) => ({
          id: normalizeRequiredString(item.id, crypto.randomUUID()),
          path: normalizeRequiredString(item.path, '/'),
          sessionId: normalizeNullableString(item.sessionId, 120),
          referrer: normalizeNullableString(item.referrer, 400),
          userAgent: normalizeNullableString(item.userAgent, 600),
          ipHash: normalizeNullableString(item.ipHash, 120),
          source: normalizeRequiredString(item.source, 'web'),
          createdAt: normalizeTimestamp(item.createdAt, now)
        }))
      : [],
    searches: Array.isArray(raw.searches)
      ? raw.searches.map((item) => ({
          id: normalizeRequiredString(item.id, crypto.randomUUID()),
          query: normalizeRequiredString(item.query),
          normalizedQuery: normalizeRequiredString(item.normalizedQuery),
          resultCount: normalizeInteger(item.resultCount),
          sessionId: normalizeNullableString(item.sessionId, 120),
          referrer: normalizeNullableString(item.referrer, 400),
          userAgent: normalizeNullableString(item.userAgent, 600),
          ipHash: normalizeNullableString(item.ipHash, 120),
          createdAt: normalizeTimestamp(item.createdAt, now)
        }))
      : [],
    aiUsage: Array.isArray(raw.aiUsage)
      ? raw.aiUsage.map((item) => ({
          id: normalizeRequiredString(item.id, crypto.randomUUID()),
          feature: normalizeRequiredString(item.feature),
          provider: normalizeRequiredString(item.provider, 'longcat'),
          model: normalizeNullableString(item.model, 160),
          articleSlug: normalizeNullableString(item.articleSlug, 160),
          status: normalizeRequiredString(item.status, 'UNKNOWN'),
          promptLength: normalizeNullableInteger(item.promptLength),
          selectionLength: normalizeNullableInteger(item.selectionLength),
          outputLength: normalizeNullableInteger(item.outputLength),
          durationMs: normalizeNullableInteger(item.durationMs),
          errorMessage: normalizeNullableString(item.errorMessage, 1200),
          sessionId: normalizeNullableString(item.sessionId, 120),
          userAgent: normalizeNullableString(item.userAgent, 600),
          ipHash: normalizeNullableString(item.ipHash, 120),
          createdAt: normalizeTimestamp(item.createdAt, now)
        }))
      : []
  } satisfies StoredTelemetryState
}

async function readFallbackTelemetryState() {
  try {
    const raw = await readFile(TELEMETRY_STORE_PATH, 'utf8')
    return hydrateTelemetryState(JSON.parse(raw) as Partial<StoredTelemetryState>)
  } catch {
    const emptyState = buildEmptyTelemetryState()
    await writeFallbackTelemetryState(emptyState)
    return emptyState
  }
}

async function writeFallbackTelemetryState(state: StoredTelemetryState) {
  await mkdir(join(process.cwd(), '.data'), {
    recursive: true
  })
  await writeFile(TELEMETRY_STORE_PATH, JSON.stringify(state, null, 2), 'utf8')
}

async function runTelemetryWithPrisma<T>(
  runner: (prisma: TelemetryPrismaClient) => Promise<T>
): Promise<T | null> {
  const config = useRuntimeConfig()

  if (!config.databaseUrl) {
    return null
  }

  try {
    const prisma = (await getPrismaClient()) as TelemetryPrismaClient
    return await runner(prisma)
  } catch {
    return null
  }
}

function buildTelemetryContext(event: H3Event, referrerOverride?: string | null): TelemetryContext {
  const fingerprint = getClientFingerprint(event)
  const hashedFingerprint = fingerprint
    ? createHash('sha256').update(fingerprint).digest('hex').slice(0, 24)
    : null

  return {
    sessionId: normalizeNullableString(getCookie(event, 'telemetry_session'), 120),
    referrer: normalizeNullableString(referrerOverride ?? getHeader(event, 'referer'), 400),
    userAgent: normalizeNullableString(getHeader(event, 'user-agent'), 600),
    ipHash: hashedFingerprint
  }
}

function normalizeSearchQuery(value: string) {
  return value.trim().replace(/\s+/gu, ' ').toLowerCase()
}

function normalizePath(value: string) {
  const trimmed = value.trim()
  return trimmed.startsWith('/') ? trimmed.slice(0, 240) : `/${trimmed.slice(0, 239)}`
}

function buildFallbackSummary(state: StoredTelemetryState): TelemetrySummaryResponse {
  const cutoff = Date.now() - LOOKBACK_WINDOW_MS
  const pageVisits = state.pageVisits.filter((item) => Date.parse(item.createdAt) >= cutoff)
  const searches = state.searches.filter((item) => Date.parse(item.createdAt) >= cutoff)
  const aiUsage = state.aiUsage.filter((item) => Date.parse(item.createdAt) >= cutoff)
  const queryCounts = new Map<string, { query: string; count: number }>()

  for (const item of searches) {
    if (!item.normalizedQuery) {
      continue
    }

    const existing = queryCounts.get(item.normalizedQuery)

    if (existing) {
      existing.count += 1
      queryCounts.set(item.normalizedQuery, existing)
      continue
    }

    queryCounts.set(item.normalizedQuery, {
      query: item.query || item.normalizedQuery,
      count: 1
    })
  }

  return {
    provider: 'fallback',
    configured: Boolean(useRuntimeConfig().databaseUrl),
    pageVisitsLast7Days: pageVisits.length,
    searchesLast7Days: searches.length,
    aiRequestsLast7Days: aiUsage.length,
    topQueries: Array.from(queryCounts.values())
      .sort((left, right) => right.count - left.count || left.query.localeCompare(right.query))
      .slice(0, 5),
    recentAiEvents: aiUsage
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        feature: item.feature,
        status: item.status,
        model: item.model || item.provider,
        articleSlug: item.articleSlug,
        createdAt: item.createdAt
      }))
  }
}

export function toTelemetryErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return null
  }

  const maybeError = error as {
    statusMessage?: string
    message?: string
    data?: {
      statusMessage?: string
      message?: string
    }
  }

  return (
    normalizeNullableString(maybeError.statusMessage, 1200) ||
    normalizeNullableString(maybeError.data?.statusMessage, 1200) ||
    normalizeNullableString(maybeError.data?.message, 1200) ||
    normalizeNullableString(maybeError.message, 1200)
  )
}

export async function recordPageVisit(event: H3Event, input: RecordPageVisitInput) {
  const context = buildTelemetryContext(event, input.referrer)
  const record: StoredPageVisitLog = {
    id: crypto.randomUUID(),
    path: normalizePath(input.path),
    sessionId: context.sessionId,
    referrer: context.referrer,
    userAgent: context.userAgent,
    ipHash: context.ipHash,
    source: normalizeRequiredString(input.source, 'web'),
    createdAt: new Date().toISOString()
  }

  const created = await runTelemetryWithPrisma(async (prisma) => {
    if (!prisma.pageVisitLog?.create) {
      return null
    }

    await prisma.pageVisitLog.create({
      data: record
    })

    return true
  })

  if (created) {
    return
  }

  const state = await readFallbackTelemetryState()
  state.pageVisits.push(record)
  state.pageVisits = state.pageVisits.slice(-500)
  await writeFallbackTelemetryState(state)
}

export async function recordSearchQuery(event: H3Event, input: RecordSearchInput) {
  const normalizedQuery = normalizeSearchQuery(input.query)

  if (!normalizedQuery) {
    return
  }

  const context = buildTelemetryContext(event)
  const record: StoredSearchLog = {
    id: crypto.randomUUID(),
    query: input.query.trim().replace(/\s+/gu, ' ').slice(0, 400),
    normalizedQuery,
    resultCount: Math.max(0, Math.floor(input.resultCount)),
    sessionId: context.sessionId,
    referrer: context.referrer,
    userAgent: context.userAgent,
    ipHash: context.ipHash,
    createdAt: new Date().toISOString()
  }

  const created = await runTelemetryWithPrisma(async (prisma) => {
    if (!prisma.searchLog?.create) {
      return null
    }

    await prisma.searchLog.create({
      data: record
    })

    return true
  })

  if (created) {
    return
  }

  const state = await readFallbackTelemetryState()
  state.searches.push(record)
  state.searches = state.searches.slice(-500)
  await writeFallbackTelemetryState(state)
}

export async function recordAiUsage(event: H3Event, input: RecordAiUsageInput) {
  const context = buildTelemetryContext(event)
  const record: StoredAiUsageLog = {
    id: crypto.randomUUID(),
    feature: normalizeRequiredString(input.feature),
    provider: normalizeRequiredString(input.provider, 'longcat'),
    model: normalizeNullableString(input.model, 160),
    articleSlug: normalizeNullableString(input.articleSlug, 160),
    status: normalizeRequiredString(input.status, 'UNKNOWN'),
    promptLength: normalizeNullableInteger(input.promptLength),
    selectionLength: normalizeNullableInteger(input.selectionLength),
    outputLength: normalizeNullableInteger(input.outputLength),
    durationMs: normalizeNullableInteger(input.durationMs),
    errorMessage: normalizeNullableString(input.errorMessage, 1200),
    sessionId: context.sessionId,
    userAgent: context.userAgent,
    ipHash: context.ipHash,
    createdAt: new Date().toISOString()
  }

  const created = await runTelemetryWithPrisma(async (prisma) => {
    if (!prisma.aiUsageLog?.create) {
      return null
    }

    await prisma.aiUsageLog.create({
      data: record
    })

    return true
  })

  if (created) {
    return
  }

  const state = await readFallbackTelemetryState()
  state.aiUsage.push(record)
  state.aiUsage = state.aiUsage.slice(-500)
  await writeFallbackTelemetryState(state)
}

export async function getTelemetrySummary(): Promise<TelemetrySummaryResponse> {
  const dbSummary = await runTelemetryWithPrisma(async (prisma) => {
    if (!prisma.pageVisitLog?.findMany || !prisma.searchLog?.findMany || !prisma.aiUsageLog?.findMany) {
      return null
    }

    const cutoff = new Date(Date.now() - LOOKBACK_WINDOW_MS)
    const [pageVisits, searches, aiUsage] = await Promise.all([
      prisma.pageVisitLog.findMany({
        where: {
          createdAt: {
            gte: cutoff
          }
        }
      }),
      prisma.searchLog.findMany({
        where: {
          createdAt: {
            gte: cutoff
          }
        }
      }),
      prisma.aiUsageLog.findMany({
        where: {
          createdAt: {
            gte: cutoff
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    const queryCounts = new Map<string, { query: string; count: number }>()

    for (const item of searches) {
      const normalizedQuery = normalizeRequiredString(item.normalizedQuery)
      const query = normalizeRequiredString(item.query)

      if (!normalizedQuery) {
        continue
      }

      const existing = queryCounts.get(normalizedQuery)

      if (existing) {
        existing.count += 1
        queryCounts.set(normalizedQuery, existing)
        continue
      }

      queryCounts.set(normalizedQuery, {
        query: query || normalizedQuery,
        count: 1
      })
    }

    return {
      provider: 'database' as const,
      configured: true,
      pageVisitsLast7Days: pageVisits.length,
      searchesLast7Days: searches.length,
      aiRequestsLast7Days: aiUsage.length,
      topQueries: Array.from(queryCounts.values())
        .sort((left, right) => right.count - left.count || left.query.localeCompare(right.query))
        .slice(0, 5),
      recentAiEvents: aiUsage.slice(0, 5).map((item) => ({
        id: normalizeRequiredString(item.id, crypto.randomUUID()),
        feature: normalizeRequiredString(item.feature),
        status: normalizeRequiredString(item.status),
        model: normalizeRequiredString(item.model, normalizeRequiredString(item.provider, 'longcat')),
        articleSlug: normalizeNullableString(item.articleSlug, 160),
        createdAt: normalizeTimestamp(item.createdAt, new Date().toISOString())
      }))
    }
  })

  if (dbSummary) {
    return dbSummary
  }

  const fallbackState = await readFallbackTelemetryState()
  return buildFallbackSummary(fallbackState)
}
