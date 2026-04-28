import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createError } from 'h3'
import { articles as seedArticles } from '~/data/articles'
import { projects as seedProjects } from '~/data/projects'
import { getPrismaClient } from '~/server/lib/prisma'
import { createSlug, estimateReadingTime, uniqueStrings } from '~/server/utils/slug'
import type {
  ArticleEditorPayload,
  ArticleRecord,
  ArticleStatusAction,
  DashboardResponse,
  ProjectEditorPayload,
  ProjectRecord,
  TagEditorPayload,
  TagRecord,
  TopicEditorPayload,
  TopicRecord
} from '~/types/content-studio'

interface StoredTopic {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

interface StoredTag {
  id: string
  name: string
  slug: string
  color: string | null
  createdAt: string
  updatedAt: string
}

interface StoredProject {
  id: string
  title: string
  slug: string
  summary: string
  contentMd: string
  stack: string[]
  repoUrl: string
  demoUrl: string
  status: ProjectRecord['status']
  isFeatured: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

interface StoredArticle {
  id: string
  title: string
  slug: string
  summary: string
  excerpt: string
  bodyMd: string
  coverImageUrl: string
  readingTime: number
  status: ArticleRecord['status']
  isFeatured: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  seoTitle: string
  seoDescription: string
  topicId: string | null
  tagIds: string[]
}

interface StoredState {
  articles: StoredArticle[]
  topics: StoredTopic[]
  tags: StoredTag[]
  projects: StoredProject[]
}

interface PrismaTopicSource {
  id: string
  name: string
  slug: string
  description?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  _count?: {
    articles: number
  }
}

interface PrismaTagSource {
  id: string
  name: string
  slug: string
  color?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  _count?: {
    articles: number
  }
}

interface PrismaArticleTagJoin {
  tag: PrismaTagSource
}

interface PrismaArticleSource {
  id: string
  title: string
  slug: string
  summary: string
  excerpt?: string | null
  bodyMd: string
  coverImageUrl?: string | null
  readingTime: number
  status: ArticleRecord['status']
  isFeatured: boolean
  publishedAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  seoTitle?: string | null
  seoDescription?: string | null
  topic?: PrismaTopicSource | null
  tags?: PrismaArticleTagJoin[]
}

interface PrismaProjectSource {
  id: string
  title: string
  slug: string
  summary: string
  contentMd?: string | null
  stack?: unknown
  repoUrl?: string | null
  demoUrl?: string | null
  status: ProjectRecord['status']
  isFeatured: boolean
  publishedAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

interface PrismaDelegate<T> {
  findMany(args: Record<string, unknown>): Promise<T[]>
  findUnique(args: Record<string, unknown>): Promise<T | null>
  create(args: Record<string, unknown>): Promise<T>
  update(args: Record<string, unknown>): Promise<T>
  delete(args: Record<string, unknown>): Promise<unknown>
  count(args?: Record<string, unknown>): Promise<number>
}

interface PrismaArticleDelegate extends PrismaDelegate<PrismaArticleSource> {
  updateMany(args: Record<string, unknown>): Promise<unknown>
}

interface PrismaProjectDelegate extends PrismaDelegate<PrismaProjectSource> {
  updateMany(args: Record<string, unknown>): Promise<unknown>
}

type PrismaTopicDelegate = PrismaDelegate<PrismaTopicSource>
type PrismaTagDelegate = PrismaDelegate<PrismaTagSource>

interface PrismaClientAdapter {
  article: PrismaArticleDelegate
  topic: PrismaTopicDelegate
  tag: PrismaTagDelegate
  project: PrismaProjectDelegate
}

const STORE_PATH = join(process.cwd(), '.data', 'content-studio.json')
const canUseLocalFallbackStore = !process.env.VERCEL
let memoryFallbackState: StoredState | null = null

const projectSortWeight: Record<ProjectRecord['status'], number> = {
  LIVE: 0,
  BUILDING: 1,
  ARCHIVED: 2
}

function compareRecentItems(
  left: Pick<ArticleRecord, 'updatedAt' | 'createdAt' | 'id'>,
  right: Pick<ArticleRecord, 'updatedAt' | 'createdAt' | 'id'>
) {
  const updatedAtDelta = right.updatedAt.localeCompare(left.updatedAt)

  if (updatedAtDelta !== 0) {
    return updatedAtDelta
  }

  const createdAtDelta = right.createdAt.localeCompare(left.createdAt)

  if (createdAtDelta !== 0) {
    return createdAtDelta
  }

  return right.id.localeCompare(left.id)
}

function isErrorWithStatusCode(error: unknown): error is { statusCode: number } {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
  )
}

function toIsoString(value: Date | string) {
  return new Date(value).toISOString()
}

function toNullableIsoString(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null
}

function normalizeTimestamp(value: unknown, fallback: string) {
  if (typeof value !== 'string' || !value) {
    return fallback
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? fallback : new Date(timestamp).toISOString()
}

function buildSeedMarkdown(title: string, summary: string, excerpt: string, aiAngle: string) {
  return [
    `# ${title}`,
    '',
    summary,
    '',
    '## 核心要点',
    excerpt,
    '',
    '## AI 视角',
    aiAngle,
    '',
    '## 下一步',
    '- 继续补充更完整的实现过程与落地细节。',
    '- 将文章与相关实验页或项目案例建立关联。',
    '- 在后台补充发布时间、封面与专题标签等信息。'
  ].join('\n')
}

function buildSeedProjectMarkdown(title: string, summary: string, impact: string) {
  return [
    `# ${title}`,
    '',
    summary,
    '',
    '## 项目价值',
    impact,
    '',
    '## 执行说明',
    '- 从用户流程、系统架构与交付决策三个层面拆解项目。',
    '- 记录技术栈取舍，以及 MVP 阶段刻意暂缓的能力。',
    '- 完成后补充截图、仓库地址与部署说明。'
  ].join('\n')
}

function normalizeTopicName(value: string) {
  return value.trim()
}

function normalizeTagName(value: string) {
  return value.trim()
}

function normalizeTagNames(values: string[]) {
  return uniqueStrings(values.map((value) => normalizeTagName(value)).filter(Boolean))
}

function normalizeProjectStack(values: string[]) {
  return uniqueStrings(values.map((value) => value.trim()).filter(Boolean))
}

function normalizeArticlePayload(payload: ArticleEditorPayload) {
  const title = payload.title.trim()
  const slug = createSlug(payload.slug || title)
  const summary = payload.summary.trim()
  const excerpt = payload.excerpt.trim() || summary
  const bodyMd = payload.bodyMd.trim()
  const coverImageUrl = payload.coverImageUrl.trim()
  const seoTitle = payload.seoTitle.trim() || title
  const seoDescription = payload.seoDescription.trim() || summary
  const topicName = normalizeTopicName(payload.topicName)
  const tagNames = normalizeTagNames(payload.tagNames)

  if (!title || !slug || !summary || !bodyMd) {
    throw createError({
      statusCode: 400,
      statusMessage: '标题、slug、摘要和正文 Markdown 内容不能为空。'
    })
  }

  return {
    ...payload,
    title,
    slug,
    summary,
    excerpt,
    bodyMd,
    coverImageUrl,
    seoTitle,
    seoDescription,
    topicName,
    tagNames,
    readingTime: estimateReadingTime(bodyMd)
  }
}

function normalizeTopicPayload(payload: TopicEditorPayload) {
  const name = normalizeTopicName(payload.name)
  const slug = createSlug(name)
  const description = payload.description.trim()

  if (!name || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: '专题名称不能为空。'
    })
  }

  return {
    name,
    slug,
    description
  }
}

function normalizeTagPayload(payload: TagEditorPayload) {
  const name = normalizeTagName(payload.name)
  const slug = createSlug(name)
  const color = payload.color.trim()

  if (!name || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: '标签名称不能为空。'
    })
  }

  return {
    name,
    slug,
    color
  }
}

function normalizeProjectPayload(payload: ProjectEditorPayload) {
  const title = payload.title.trim()
  const slug = createSlug(payload.slug || title)
  const summary = payload.summary.trim()
  const contentMd = payload.contentMd.trim()
  const stack = normalizeProjectStack(payload.stack)
  const repoUrl = payload.repoUrl.trim()
  const demoUrl = payload.demoUrl.trim()

  if (!title || !slug || !summary) {
    throw createError({
      statusCode: 400,
      statusMessage: '项目标题、slug 和摘要不能为空。'
    })
  }

  return {
    ...payload,
    title,
    slug,
    summary,
    contentMd,
    stack,
    repoUrl,
    demoUrl
  }
}

function countArticlesForTopic(state: StoredState, topicId: string) {
  return state.articles.filter((article) => article.topicId === topicId).length
}

function countArticlesForTag(state: StoredState, tagId: string) {
  return state.articles.filter((article) => article.tagIds.includes(tagId)).length
}

function toTopicRecordFromStored(state: StoredState, topic: StoredTopic): TopicRecord {
  return {
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
    description: topic.description,
    articleCount: countArticlesForTopic(state, topic.id),
    createdAt: topic.createdAt,
    updatedAt: topic.updatedAt
  }
}

function toTagRecordFromStored(state: StoredState, tag: StoredTag): TagRecord {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
    articleCount: countArticlesForTag(state, tag.id),
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt
  }
}

function toTopicRecordFromDb(topic: PrismaTopicSource): TopicRecord {
  return {
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
    description: topic.description ?? null,
    articleCount: topic._count?.articles ?? 0,
    createdAt: toIsoString(topic.createdAt),
    updatedAt: toIsoString(topic.updatedAt)
  }
}

function toTagRecordFromDb(tag: PrismaTagSource): TagRecord {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    color: tag.color ?? null,
    articleCount: tag._count?.articles ?? 0,
    createdAt: toIsoString(tag.createdAt),
    updatedAt: toIsoString(tag.updatedAt)
  }
}

function toProjectRecordFromStored(project: StoredProject): ProjectRecord {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    contentMd: project.contentMd,
    stack: project.stack,
    repoUrl: project.repoUrl,
    demoUrl: project.demoUrl,
    status: project.status,
    isFeatured: project.isFeatured,
    publishedAt: project.publishedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  }
}

function parseProjectStack(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return uniqueStrings(
    value.map((item) => String(item || '').trim()).filter((item) => item.length > 0)
  )
}

function toProjectRecordFromDb(project: PrismaProjectSource): ProjectRecord {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    contentMd: project.contentMd ?? '',
    stack: parseProjectStack(project.stack),
    repoUrl: project.repoUrl ?? '',
    demoUrl: project.demoUrl ?? '',
    status: project.status,
    isFeatured: project.isFeatured,
    publishedAt: toNullableIsoString(project.publishedAt),
    createdAt: toIsoString(project.createdAt),
    updatedAt: toIsoString(project.updatedAt)
  }
}

function toArticleRecord(state: StoredState, article: StoredArticle): ArticleRecord {
  const topic = article.topicId
    ? state.topics.find((item) => item.id === article.topicId) ?? null
    : null

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    excerpt: article.excerpt,
    bodyMd: article.bodyMd,
    coverImageUrl: article.coverImageUrl,
    readingTime: article.readingTime,
    status: article.status,
    isFeatured: article.isFeatured,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    topic: topic ? toTopicRecordFromStored(state, topic) : null,
    tags: state.tags
      .filter((tag) => article.tagIds.includes(tag.id))
      .map((tag) => toTagRecordFromStored(state, tag))
  }
}

function toDbArticleRecord(article: PrismaArticleSource): ArticleRecord {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    excerpt: article.excerpt ?? article.summary,
    bodyMd: article.bodyMd,
    coverImageUrl: article.coverImageUrl ?? '',
    readingTime: article.readingTime,
    status: article.status,
    isFeatured: article.isFeatured,
    publishedAt: toNullableIsoString(article.publishedAt),
    createdAt: toIsoString(article.createdAt),
    updatedAt: toIsoString(article.updatedAt),
    seoTitle: article.seoTitle ?? article.title,
    seoDescription: article.seoDescription ?? article.summary,
    topic: article.topic ? toTopicRecordFromDb(article.topic) : null,
    tags: article.tags?.map((item) => toTagRecordFromDb(item.tag)) ?? []
  }
}

function mapSeedProjectStatus(status: string): ProjectRecord['status'] {
  if (status === 'Live') {
    return 'LIVE'
  }

  if (status === 'Archived') {
    return 'ARCHIVED'
  }

  return 'BUILDING'
}

function buildSeedProjects(now: string): StoredProject[] {
  return seedProjects.map((project, index) => {
    const status = mapSeedProjectStatus(project.status)

    return {
      id: project.id,
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      contentMd: buildSeedProjectMarkdown(project.title, project.summary, project.impact),
      stack: project.stack,
      repoUrl: '',
      demoUrl: '',
      status,
      isFeatured: index === 0,
      publishedAt: status === 'LIVE' ? now : null,
      createdAt: now,
      updatedAt: now
    }
  })
}

const seedTopicDescriptions: Record<string, string> = {
  'Vue 3 与 TypeScript': '组件设计、组合式 API、类型约束与工程实践。',
  'HTML 与 CSS': '语义化结构、响应式布局与可访问性。',
  'JavaScript / ES6+': '语言特性、异步流程与常见工程写法。',
  浏览器原理: '渲染流程、缓存机制与性能排查。',
  计算机网络: 'HTTP、缓存、跨域与网络请求排查。',
  计算机基础: '进程、线程、内存与前端工程基础。',
  'AI 工具与工作流': '模型平台、提示词和阅读辅助实践。'
}

function buildFallbackState(): StoredState {
  const topicsBySlug = new Map<string, StoredTopic>()
  const tagsBySlug = new Map<string, StoredTag>()
  const now = new Date().toISOString()

  const articles = seedArticles.map((article) => {
    const topicSlug = createSlug(article.category)
    const topic =
      topicsBySlug.get(topicSlug) ??
      {
        id: randomUUID(),
        name: article.category,
        slug: topicSlug,
        description:
          seedTopicDescriptions[article.category] ||
          `${article.category} 的文章归档与实践记录。`,
        createdAt: article.publishedAt || now,
        updatedAt: now
      }

    topicsBySlug.set(topic.slug, topic)

    const tagIds = article.tags.map((tag) => {
      const tagSlug = createSlug(tag)
      const tagRecord =
        tagsBySlug.get(tagSlug) ??
        {
          id: randomUUID(),
          name: tag,
          slug: tagSlug,
          color: null,
          createdAt: article.publishedAt || now,
          updatedAt: now
        }

      tagsBySlug.set(tagRecord.slug, tagRecord)
      return tagRecord.id
    })

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      excerpt: article.excerpt,
      bodyMd: buildSeedMarkdown(article.title, article.summary, article.excerpt, article.aiAngle),
      coverImageUrl: '',
      readingTime: Number.parseInt(article.readingTime, 10) || 1,
      status: 'PUBLISHED' as const,
      isFeatured: Boolean(article.featured),
      publishedAt: article.publishedAt || now,
      createdAt: article.publishedAt || now,
      updatedAt: now,
      seoTitle: article.title,
      seoDescription: article.summary,
      topicId: topic.id,
      tagIds
    }
  })

  return {
    articles,
    topics: Array.from(topicsBySlug.values()),
    tags: Array.from(tagsBySlug.values()),
    projects: buildSeedProjects(now)
  }
}

function hydrateStoredState(raw: Partial<StoredState>) {
  const now = new Date().toISOString()

  const topics = Array.isArray(raw.topics)
    ? raw.topics.map((topic) => {
        const createdAt = normalizeTimestamp(topic.createdAt, now)

        return {
          id: String(topic.id || randomUUID()),
          name: String(topic.name || '未命名专题').trim(),
          slug: createSlug(String(topic.slug || topic.name || '未命名专题')),
          description: topic.description ? String(topic.description) : null,
          createdAt,
          updatedAt: normalizeTimestamp(topic.updatedAt, createdAt)
        } satisfies StoredTopic
      })
    : []

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((tag) => {
        const createdAt = normalizeTimestamp(tag.createdAt, now)

        return {
          id: String(tag.id || randomUUID()),
          name: String(tag.name || '未命名标签').trim(),
          slug: createSlug(String(tag.slug || tag.name || '未命名标签')),
          color: tag.color ? String(tag.color) : null,
          createdAt,
          updatedAt: normalizeTimestamp(tag.updatedAt, createdAt)
        } satisfies StoredTag
      })
    : []

  const articles = Array.isArray(raw.articles)
    ? raw.articles.map((article) => {
        const createdAt = normalizeTimestamp(article.createdAt, now)
        const summary = String(article.summary || '').trim()
        const bodyMd = String(article.bodyMd || '').trim()

        return {
          id: String(article.id || randomUUID()),
          title: String(article.title || '未命名文章').trim(),
          slug: createSlug(String(article.slug || article.title || '未命名文章')),
          summary,
          excerpt: String(article.excerpt || summary).trim() || summary,
          bodyMd,
          coverImageUrl: String(article.coverImageUrl || '').trim(),
          readingTime: Number(article.readingTime) || estimateReadingTime(bodyMd || summary),
          status: ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'].includes(String(article.status))
            ? (article.status as ArticleRecord['status'])
            : 'DRAFT',
          isFeatured: Boolean(article.isFeatured),
          publishedAt:
            typeof article.publishedAt === 'string'
              ? normalizeTimestamp(article.publishedAt, createdAt)
              : null,
          createdAt,
          updatedAt: normalizeTimestamp(article.updatedAt, createdAt),
          seoTitle: String(article.seoTitle || article.title || '未命名文章').trim(),
          seoDescription: String(article.seoDescription || summary).trim() || summary,
          topicId: article.topicId ? String(article.topicId) : null,
          tagIds: Array.isArray(article.tagIds)
            ? uniqueStrings(article.tagIds.map((tagId) => String(tagId)))
            : []
        } satisfies StoredArticle
      })
    : []

  const projects =
    Array.isArray(raw.projects) && raw.projects.length > 0
      ? raw.projects.map((project) => {
          const createdAt = normalizeTimestamp(project.createdAt, now)

          return {
            id: String(project.id || randomUUID()),
            title: String(project.title || '未命名项目').trim(),
            slug: createSlug(String(project.slug || project.title || '未命名项目')),
            summary: String(project.summary || '').trim(),
            contentMd: String(project.contentMd || '').trim(),
            stack: normalizeProjectStack(Array.isArray(project.stack) ? project.stack : []),
            repoUrl: String(project.repoUrl || '').trim(),
            demoUrl: String(project.demoUrl || '').trim(),
            status: ['BUILDING', 'LIVE', 'ARCHIVED'].includes(String(project.status))
              ? (project.status as ProjectRecord['status'])
              : 'BUILDING',
            isFeatured: Boolean(project.isFeatured),
            publishedAt:
              typeof project.publishedAt === 'string'
                ? normalizeTimestamp(project.publishedAt, createdAt)
                : null,
            createdAt,
            updatedAt: normalizeTimestamp(project.updatedAt, createdAt)
          } satisfies StoredProject
        })
      : buildSeedProjects(now)

  return {
    articles,
    topics,
    tags,
    projects
  } satisfies StoredState
}

async function readFallbackState() {
  if (!canUseLocalFallbackStore) {
    if (!memoryFallbackState) {
      memoryFallbackState = buildFallbackState()
    }

    return memoryFallbackState
  }

  try {
    const raw = await readFile(STORE_PATH, 'utf8')
    return hydrateStoredState(JSON.parse(raw) as Partial<StoredState>)
  } catch {
    const state = buildFallbackState()
    await writeFallbackStateSafely(state)
    return state
  }
}

async function writeFallbackState(state: StoredState) {
  memoryFallbackState = state

  if (!canUseLocalFallbackStore) {
    return
  }

  await mkdir(join(process.cwd(), '.data'), {
    recursive: true
  })
  await writeFile(STORE_PATH, JSON.stringify(state, null, 2), 'utf8')
}

async function writeFallbackStateSafely(state: StoredState) {
  try {
    await writeFallbackState(state)
  } catch {
    // Some deployment targets use a read-only filesystem. In that case,
    // keep serving the in-memory fallback state instead of failing the request.
  }
}

interface RunWithPrismaOptions {
  fallbackOnError?: boolean
  operation?: string
}

function toOperationalErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return '未知数据库错误。'
  }

  return error.message.replace(/\s+/gu, ' ').trim() || '未知数据库错误。'
}

async function runWithPrisma<T>(
  runner: (prisma: PrismaClientAdapter) => Promise<T>,
  options: RunWithPrismaOptions = {}
) {
  const config = useRuntimeConfig()
  const { fallbackOnError = true, operation = '数据库请求' } = options

  if (!config.databaseUrl) {
    return null
  }

  try {
    const prisma = await getPrismaClient()
    return await runner(prisma as unknown as PrismaClientAdapter)
  } catch (error) {
    if (isErrorWithStatusCode(error)) {
      throw error
    }

    if (!fallbackOnError) {
      throw createError({
        statusCode: 503,
        statusMessage: `${operation}失败：${toOperationalErrorMessage(error)}`
      })
    }

    return null
  }
}

async function syncFeaturedArticleStateWithPrisma(prisma: PrismaClientAdapter, articleId: string) {
  await prisma.article.updateMany({
    where: {
      NOT: {
        id: articleId
      }
    },
    data: {
      isFeatured: false
    }
  })
}

async function syncFeaturedProjectStateWithPrisma(prisma: PrismaClientAdapter, projectId: string) {
  await prisma.project.updateMany({
    where: {
      NOT: {
        id: projectId
      }
    },
    data: {
      isFeatured: false
    }
  })
}

function ensureTopicInFallback(state: StoredState, topicName: string) {
  if (!topicName) {
    return null
  }

  const slug = createSlug(topicName)
  const existing = state.topics.find((topic) => topic.slug === slug)

  if (existing) {
    return existing.id
  }

  const timestamp = new Date().toISOString()
  const topic: StoredTopic = {
    id: randomUUID(),
    name: topicName,
    slug,
    description: null,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  state.topics.push(topic)
  return topic.id
}

function ensureTagsInFallback(state: StoredState, tagNames: string[]) {
  return tagNames.map((tagName) => {
    const slug = createSlug(tagName)
    const existing = state.tags.find((tag) => tag.slug === slug)

    if (existing) {
      return existing.id
    }

    const timestamp = new Date().toISOString()
    const tag: StoredTag = {
      id: randomUUID(),
      name: tagName,
      slug,
      color: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    state.tags.push(tag)
    return tag.id
  })
}

function getStorageState() {
  const config = useRuntimeConfig()
  const configured = Boolean(
    config.public.supabaseUrl && config.supabaseServiceRoleKey && config.supabaseStorageBucket
  )

  return {
    driver: configured ? 'supabase' : 'inline',
    configured
  } as const
}

function sortProjects(left: ProjectRecord, right: ProjectRecord) {
  if (left.isFeatured !== right.isFeatured) {
    return Number(right.isFeatured) - Number(left.isFeatured)
  }

  const statusDelta = projectSortWeight[left.status] - projectSortWeight[right.status]

  if (statusDelta !== 0) {
    return statusDelta
  }

  return compareRecentItems(left, right)
}

function resolveArticleStatusChange(
  current: {
    isFeatured: boolean
    publishedAt?: Date | string | null
  },
  action: ArticleStatusAction,
  now: string
) {
  switch (action) {
    case 'MOVE_TO_DRAFT':
      return {
        status: 'DRAFT' as const,
        isFeatured: false,
        publishedAt: null
      }
    case 'MOVE_TO_REVIEW':
      return {
        status: 'REVIEW' as const,
        isFeatured: false,
        publishedAt: null
      }
    case 'PUBLISH':
      return {
        status: 'PUBLISHED' as const,
        isFeatured: current.isFeatured,
        publishedAt: toNullableIsoString(current.publishedAt) || now
      }
    case 'ARCHIVE':
      return {
        status: 'ARCHIVED' as const,
        isFeatured: false,
        publishedAt: null
      }
  }
}

function assertTopicSlugAvailable(
  topics: StoredTopic[],
  slug: string,
  currentId?: string | null
) {
  const duplicate = topics.find((topic) => topic.slug === slug && topic.id !== currentId)

  if (duplicate) {
    throw createError({
      statusCode: 409,
      statusMessage: `专题“${duplicate.name}”已存在。`
    })
  }
}

function assertTagSlugAvailable(tags: StoredTag[], slug: string, currentId?: string | null) {
  const duplicate = tags.find((tag) => tag.slug === slug && tag.id !== currentId)

  if (duplicate) {
    throw createError({
      statusCode: 409,
      statusMessage: `标签“${duplicate.name}”已存在。`
    })
  }
}

function assertArticleSlugAvailable(
  articles: StoredArticle[],
  slug: string,
  currentId?: string | null
) {
  const duplicate = articles.find((article) => article.slug === slug && article.id !== currentId)

  if (duplicate) {
    throw createError({
      statusCode: 409,
      statusMessage: `文章 slug “${slug}”已被占用。`
    })
  }
}

function assertProjectSlugAvailable(
  projects: StoredProject[],
  slug: string,
  currentId?: string | null
) {
  const duplicate = projects.find(
    (project) => project.slug === slug && project.id !== currentId
  )

  if (duplicate) {
    throw createError({
      statusCode: 409,
      statusMessage: `项目 slug “${slug}”已被占用。`
    })
  }
}

export async function listAdminArticles() {
  const dbArticles = await runWithPrisma(async (prisma) => {
    const records = await prisma.article.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      include: {
        topic: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return records.map(toDbArticleRecord)
  })

  if (dbArticles) {
    return dbArticles
  }

  const state = await readFallbackState()
  return state.articles
    .slice()
    .sort(compareRecentItems)
    .map((article) => toArticleRecord(state, article))
}

export async function getAdminArticleById(id: string) {
  const dbArticle = await runWithPrisma(async (prisma) => {
    const record = await prisma.article.findUnique({
      where: { id },
      include: {
        topic: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return record ? toDbArticleRecord(record) : null
  })

  if (dbArticle) {
    return dbArticle
  }

  const state = await readFallbackState()
  const article = state.articles.find((item) => item.id === id)
  return article ? toArticleRecord(state, article) : null
}

export async function getPublicArticleBySlug(slug: string) {
  const dbArticle = await runWithPrisma(async (prisma) => {
    const record = await prisma.article.findUnique({
      where: { slug },
      include: {
        topic: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!record || record.status !== 'PUBLISHED') {
      return null
    }

    return toDbArticleRecord(record)
  })

  if (dbArticle) {
    return dbArticle
  }

  const state = await readFallbackState()
  const article = state.articles.find((item) => item.slug === slug && item.status === 'PUBLISHED')
  return article ? toArticleRecord(state, article) : null
}

export async function listPublicArticles() {
  const articles = await listAdminArticles()
  return articles.filter((article) => article.status === 'PUBLISHED')
}

export async function listPublicTopics() {
  const articles = await listPublicArticles()
  const topics = new Map<
    string,
    {
      topic: TopicRecord
      articles: ArticleRecord[]
    }
  >()

  for (const article of articles) {
    if (!article.topic) {
      continue
    }

    const existing = topics.get(article.topic.slug)

    if (existing) {
      existing.articles.push(article)
      continue
    }

    topics.set(article.topic.slug, {
      topic: {
        ...article.topic,
        articleCount: 1
      },
      articles: [article]
    })
  }

  return Array.from(topics.values())
    .map(({ topic, articles }) => ({
      ...topic,
      articleCount: articles.length
    }))
    .sort((left, right) => {
      const articleCountDelta = right.articleCount - left.articleCount

      if (articleCountDelta !== 0) {
        return articleCountDelta
      }

      return left.name.localeCompare(right.name)
    })
}

export async function getPublicTopicBySlug(slug: string) {
  const topics = await listPublicTopics()
  const topic = topics.find((item) => item.slug === slug)

  if (!topic) {
    return null
  }

  const articles = (await listPublicArticles())
    .filter((article) => article.topic?.slug === slug)
    .sort(compareRecentItems)

  return {
    topic: {
      ...topic,
      articleCount: articles.length
    },
    articles
  }
}

export async function listPublicTags() {
  const articles = await listPublicArticles()
  const tags = new Map<
    string,
    {
      tag: TagRecord
      articles: ArticleRecord[]
    }
  >()

  for (const article of articles) {
    for (const tag of article.tags) {
      const existing = tags.get(tag.slug)

      if (existing) {
        existing.articles.push(article)
        continue
      }

      tags.set(tag.slug, {
        tag: {
          ...tag,
          articleCount: 1
        },
        articles: [article]
      })
    }
  }

  return Array.from(tags.values())
    .map(({ tag, articles }) => ({
      ...tag,
      articleCount: articles.length
    }))
    .sort((left, right) => {
      const articleCountDelta = right.articleCount - left.articleCount

      if (articleCountDelta !== 0) {
        return articleCountDelta
      }

      return left.name.localeCompare(right.name)
    })
}

export async function getPublicTagBySlug(slug: string) {
  const tags = await listPublicTags()
  const tag = tags.find((item) => item.slug === slug)

  if (!tag) {
    return null
  }

  const articles = (await listPublicArticles())
    .filter((article) => article.tags.some((item) => item.slug === slug))
    .sort(compareRecentItems)

  return {
    tag: {
      ...tag,
      articleCount: articles.length
    },
    articles
  }
}

export async function listRelatedArticles(slug: string, limit = 3) {
  const articles = await listPublicArticles()
  const current = articles.find((article) => article.slug === slug)

  if (!current) {
    return []
  }

  const currentTagSlugs = new Set(current.tags.map((tag) => tag.slug))

  const scoredArticles = articles
    .filter((article) => article.slug !== slug)
    .map((article) => {
      const sharedTagCount = article.tags.filter((tag) => currentTagSlugs.has(tag.slug)).length
      const sameTopic = Boolean(
        current.topic?.slug && article.topic?.slug && current.topic.slug === article.topic.slug
      )

      return {
        article,
        score: (sameTopic ? 4 : 0) + sharedTagCount * 2 + (article.isFeatured ? 1 : 0)
      }
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return compareRecentItems(left.article, right.article)
    })

  const relevantArticles = scoredArticles.filter((item) => item.score > 0)

  return (relevantArticles.length > 0 ? relevantArticles : scoredArticles)
    .slice(0, limit)
    .map((item) => item.article)
}

export async function createArticle(payload: ArticleEditorPayload) {
  const normalized = normalizeArticlePayload(payload)

  const dbArticle = await runWithPrisma(async (prisma) => {
    const existingBySlug = await prisma.article.findUnique({
      where: { slug: normalized.slug }
    })

    if (existingBySlug) {
      throw createError({
        statusCode: 409,
        statusMessage: `文章 slug “${normalized.slug}”已被占用。`
      })
    }

    if (normalized.isFeatured) {
      await prisma.article.updateMany({
        data: {
          isFeatured: false
        }
      })
    }

    const record = await prisma.article.create({
      data: {
        title: normalized.title,
        slug: normalized.slug,
        summary: normalized.summary,
        excerpt: normalized.excerpt,
        bodyMd: normalized.bodyMd,
        coverImageUrl: normalized.coverImageUrl || null,
        readingTime: normalized.readingTime,
        status: normalized.status,
        isFeatured: normalized.isFeatured,
        publishedAt: normalized.status === 'PUBLISHED' ? new Date() : null,
        seoTitle: normalized.seoTitle,
        seoDescription: normalized.seoDescription,
        topic: normalized.topicName
          ? {
              connectOrCreate: {
                where: {
                  slug: createSlug(normalized.topicName)
                },
                create: {
                  name: normalized.topicName,
                  slug: createSlug(normalized.topicName)
                }
              }
            }
          : undefined,
        tags: {
          create: normalized.tagNames.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: {
                  slug: createSlug(tagName)
                },
                create: {
                  name: tagName,
                  slug: createSlug(tagName)
                }
              }
            }
          }))
        }
      },
      include: {
        topic: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return toDbArticleRecord(record)
  })

  if (dbArticle) {
    return dbArticle
  }

  const state = await readFallbackState()
  assertArticleSlugAvailable(state.articles, normalized.slug)

  const timestamp = new Date().toISOString()
  const topicId = ensureTopicInFallback(state, normalized.topicName)
  const tagIds = ensureTagsInFallback(state, normalized.tagNames)

  if (normalized.isFeatured) {
    state.articles = state.articles.map((article) => ({
      ...article,
      isFeatured: false
    }))
  }

  const article: StoredArticle = {
    id: randomUUID(),
    title: normalized.title,
    slug: normalized.slug,
    summary: normalized.summary,
    excerpt: normalized.excerpt,
    bodyMd: normalized.bodyMd,
    coverImageUrl: normalized.coverImageUrl,
    readingTime: normalized.readingTime,
    status: normalized.status,
    isFeatured: normalized.isFeatured,
    publishedAt: normalized.status === 'PUBLISHED' ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
    seoTitle: normalized.seoTitle,
    seoDescription: normalized.seoDescription,
    topicId,
    tagIds
  }

  state.articles.unshift(article)
  await writeFallbackStateSafely(state)
  return toArticleRecord(state, article)
}

export async function updateArticle(id: string, payload: ArticleEditorPayload) {
  const normalized = normalizeArticlePayload(payload)

  const dbArticle = await runWithPrisma(async (prisma) => {
    const existing = await prisma.article.findUnique({
      where: { id }
    })

    if (!existing) {
      return null
    }

    const existingBySlug = await prisma.article.findUnique({
      where: { slug: normalized.slug }
    })

    if (existingBySlug && existingBySlug.id !== id) {
      throw createError({
        statusCode: 409,
        statusMessage: `文章 slug “${normalized.slug}”已被占用。`
      })
    }

    if (normalized.isFeatured) {
      await syncFeaturedArticleStateWithPrisma(prisma, id)
    }

    const record = await prisma.article.update({
      where: { id },
      data: {
        title: normalized.title,
        slug: normalized.slug,
        summary: normalized.summary,
        excerpt: normalized.excerpt,
        bodyMd: normalized.bodyMd,
        coverImageUrl: normalized.coverImageUrl || null,
        readingTime: normalized.readingTime,
        status: normalized.status,
        isFeatured: normalized.isFeatured,
        publishedAt:
          normalized.status === 'PUBLISHED'
            ? existing.publishedAt ?? new Date()
            : normalized.status === 'ARCHIVED'
              ? null
              : existing.publishedAt,
        seoTitle: normalized.seoTitle,
        seoDescription: normalized.seoDescription,
        topic: normalized.topicName
          ? {
              connectOrCreate: {
                where: {
                  slug: createSlug(normalized.topicName)
                },
                create: {
                  name: normalized.topicName,
                  slug: createSlug(normalized.topicName)
                }
              }
            }
          : {
              disconnect: true
            },
        tags: {
          deleteMany: {},
          create: normalized.tagNames.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: {
                  slug: createSlug(tagName)
                },
                create: {
                  name: tagName,
                  slug: createSlug(tagName)
                }
              }
            }
          }))
        }
      },
      include: {
        topic: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return toDbArticleRecord(record)
  })

  if (dbArticle) {
    return dbArticle
  }

  const state = await readFallbackState()
  const articleIndex = state.articles.findIndex((article) => article.id === id)

  if (articleIndex < 0) {
    return null
  }

  assertArticleSlugAvailable(state.articles, normalized.slug, id)

  const existing = state.articles[articleIndex]
  const timestamp = new Date().toISOString()
  const topicId = ensureTopicInFallback(state, normalized.topicName)
  const tagIds = ensureTagsInFallback(state, normalized.tagNames)

  if (normalized.isFeatured) {
    state.articles = state.articles.map((article) => ({
      ...article,
      isFeatured: article.id === id
    }))
  }

  const nextPublishedAt =
    normalized.status === 'PUBLISHED'
      ? existing.publishedAt || timestamp
      : normalized.status === 'ARCHIVED'
        ? null
        : existing.publishedAt

  const updatedArticle: StoredArticle = {
    ...existing,
    title: normalized.title,
    slug: normalized.slug,
    summary: normalized.summary,
    excerpt: normalized.excerpt,
    bodyMd: normalized.bodyMd,
    coverImageUrl: normalized.coverImageUrl,
    readingTime: normalized.readingTime,
    status: normalized.status,
    isFeatured: normalized.isFeatured,
    publishedAt: nextPublishedAt,
    updatedAt: timestamp,
    seoTitle: normalized.seoTitle,
    seoDescription: normalized.seoDescription,
    topicId,
    tagIds
  }

  state.articles.splice(articleIndex, 1, updatedArticle)
  await writeFallbackStateSafely(state)
  return toArticleRecord(state, updatedArticle)
}

export async function updateArticleStatus(id: string, action: ArticleStatusAction) {
  const dbArticle = await runWithPrisma(async (prisma) => {
    const existing = await prisma.article.findUnique({
      where: { id }
    })

    if (!existing) {
      return null
    }

    const nextState = resolveArticleStatusChange(existing, action, new Date().toISOString())

    const record = await prisma.article.update({
      where: { id },
      data: {
        status: nextState.status,
        isFeatured: nextState.isFeatured,
        publishedAt:
          nextState.publishedAt && nextState.status === 'PUBLISHED'
            ? new Date(nextState.publishedAt)
            : null
      },
      include: {
        topic: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return toDbArticleRecord(record)
  })

  if (dbArticle) {
    return dbArticle
  }

  const state = await readFallbackState()
  const articleIndex = state.articles.findIndex((article) => article.id === id)

  if (articleIndex < 0) {
    return null
  }

  const existing = state.articles[articleIndex]
  const nextState = resolveArticleStatusChange(existing, action, new Date().toISOString())
  const updatedArticle: StoredArticle = {
    ...existing,
    status: nextState.status,
    isFeatured: nextState.isFeatured,
    publishedAt: nextState.publishedAt,
    updatedAt: new Date().toISOString()
  }

  state.articles.splice(articleIndex, 1, updatedArticle)
  await writeFallbackStateSafely(state)
  return toArticleRecord(state, updatedArticle)
}

export async function deleteArticle(id: string) {
  const dbDeleted = await runWithPrisma(async (prisma) => {
    const existing = await prisma.article.findUnique({
      where: { id }
    })

    if (!existing) {
      return false
    }

    await prisma.article.delete({
      where: { id }
    })

    return true
  })

  if (dbDeleted !== null) {
    return dbDeleted
  }

  const state = await readFallbackState()
  const nextArticles = state.articles.filter((article) => article.id !== id)

  if (nextArticles.length === state.articles.length) {
    return false
  }

  state.articles = nextArticles
  await writeFallbackStateSafely(state)
  return true
}

export async function listAdminTopics() {
  const dbTopics = await runWithPrisma(async (prisma) => {
    const records = await prisma.topic.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    return records.map(toTopicRecordFromDb)
  })

  if (dbTopics) {
    return dbTopics
  }

  const state = await readFallbackState()

  return state.topics
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((topic) => toTopicRecordFromStored(state, topic))
}

export async function createTopic(payload: TopicEditorPayload) {
  const normalized = normalizeTopicPayload(payload)

  const dbTopic = await runWithPrisma(async (prisma) => {
    const existing = await prisma.topic.findUnique({
      where: { slug: normalized.slug }
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: `专题“${existing.name}”已存在。`
      })
    }

    const record = await prisma.topic.create({
      data: {
        name: normalized.name,
        slug: normalized.slug,
        description: normalized.description || null
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    return toTopicRecordFromDb(record)
  })

  if (dbTopic) {
    return dbTopic
  }

  const state = await readFallbackState()
  assertTopicSlugAvailable(state.topics, normalized.slug)

  const timestamp = new Date().toISOString()
  const topic: StoredTopic = {
    id: randomUUID(),
    name: normalized.name,
    slug: normalized.slug,
    description: normalized.description || null,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  state.topics.push(topic)
  await writeFallbackStateSafely(state)
  return toTopicRecordFromStored(state, topic)
}

export async function updateTopic(id: string, payload: TopicEditorPayload) {
  const normalized = normalizeTopicPayload(payload)

  const dbTopic = await runWithPrisma(async (prisma) => {
    const existing = await prisma.topic.findUnique({
      where: { id }
    })

    if (!existing) {
      return null
    }

    const existingBySlug = await prisma.topic.findUnique({
      where: { slug: normalized.slug }
    })

    if (existingBySlug && existingBySlug.id !== id) {
      throw createError({
        statusCode: 409,
        statusMessage: `专题“${existingBySlug.name}”已存在。`
      })
    }

    const record = await prisma.topic.update({
      where: { id },
      data: {
        name: normalized.name,
        slug: normalized.slug,
        description: normalized.description || null
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    return toTopicRecordFromDb(record)
  })

  if (dbTopic) {
    return dbTopic
  }

  const state = await readFallbackState()
  const topicIndex = state.topics.findIndex((topic) => topic.id === id)

  if (topicIndex < 0) {
    return null
  }

  assertTopicSlugAvailable(state.topics, normalized.slug, id)

  const existing = state.topics[topicIndex]
  const topic: StoredTopic = {
    ...existing,
    name: normalized.name,
    slug: normalized.slug,
    description: normalized.description || null,
    updatedAt: new Date().toISOString()
  }

  state.topics.splice(topicIndex, 1, topic)
  await writeFallbackStateSafely(state)
  return toTopicRecordFromStored(state, topic)
}

export async function deleteTopic(id: string) {
  const dbDeleted = await runWithPrisma(async (prisma) => {
    const existing = await prisma.topic.findUnique({
      where: { id }
    })

    if (!existing) {
      return false
    }

    const articleCount = await prisma.article.count({
      where: {
        topicId: id
      }
    })

    if (articleCount > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '该专题仍关联文章，无法删除。'
      })
    }

    await prisma.topic.delete({
      where: { id }
    })

    return true
  })

  if (dbDeleted !== null) {
    return dbDeleted
  }

  const state = await readFallbackState()

  if (state.articles.some((article) => article.topicId === id)) {
    throw createError({
      statusCode: 400,
      statusMessage: '该专题仍关联文章，无法删除。'
    })
  }

  const nextTopics = state.topics.filter((topic) => topic.id !== id)

  if (nextTopics.length === state.topics.length) {
    return false
  }

  state.topics = nextTopics
  await writeFallbackStateSafely(state)
  return true
}

export async function listAdminTags() {
  const dbTags = await runWithPrisma(async (prisma) => {
    const records = await prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    return records.map(toTagRecordFromDb)
  })

  if (dbTags) {
    return dbTags
  }

  const state = await readFallbackState()

  return state.tags
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((tag) => toTagRecordFromStored(state, tag))
}

export async function createTag(payload: TagEditorPayload) {
  const normalized = normalizeTagPayload(payload)

  const dbTag = await runWithPrisma(async (prisma) => {
    const existing = await prisma.tag.findUnique({
      where: { slug: normalized.slug }
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: `标签“${existing.name}”已存在。`
      })
    }

    const record = await prisma.tag.create({
      data: {
        name: normalized.name,
        slug: normalized.slug,
        color: normalized.color || null
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    return toTagRecordFromDb(record)
  })

  if (dbTag) {
    return dbTag
  }

  const state = await readFallbackState()
  assertTagSlugAvailable(state.tags, normalized.slug)

  const timestamp = new Date().toISOString()
  const tag: StoredTag = {
    id: randomUUID(),
    name: normalized.name,
    slug: normalized.slug,
    color: normalized.color || null,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  state.tags.push(tag)
  await writeFallbackStateSafely(state)
  return toTagRecordFromStored(state, tag)
}

export async function updateTag(id: string, payload: TagEditorPayload) {
  const normalized = normalizeTagPayload(payload)

  const dbTag = await runWithPrisma(async (prisma) => {
    const existing = await prisma.tag.findUnique({
      where: { id }
    })

    if (!existing) {
      return null
    }

    const existingBySlug = await prisma.tag.findUnique({
      where: { slug: normalized.slug }
    })

    if (existingBySlug && existingBySlug.id !== id) {
      throw createError({
        statusCode: 409,
        statusMessage: `标签“${existingBySlug.name}”已存在。`
      })
    }

    const record = await prisma.tag.update({
      where: { id },
      data: {
        name: normalized.name,
        slug: normalized.slug,
        color: normalized.color || null
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    return toTagRecordFromDb(record)
  })

  if (dbTag) {
    return dbTag
  }

  const state = await readFallbackState()
  const tagIndex = state.tags.findIndex((tag) => tag.id === id)

  if (tagIndex < 0) {
    return null
  }

  assertTagSlugAvailable(state.tags, normalized.slug, id)

  const existing = state.tags[tagIndex]
  const tag: StoredTag = {
    ...existing,
    name: normalized.name,
    slug: normalized.slug,
    color: normalized.color || null,
    updatedAt: new Date().toISOString()
  }

  state.tags.splice(tagIndex, 1, tag)
  await writeFallbackStateSafely(state)
  return toTagRecordFromStored(state, tag)
}

export async function deleteTag(id: string) {
  const dbDeleted = await runWithPrisma(async (prisma) => {
    const existing = await prisma.tag.findUnique({
      where: { id }
    })

    if (!existing) {
      return false
    }

    const articleCount = await prisma.article.count({
      where: {
        tags: {
          some: {
            tagId: id
          }
        }
      }
    })

    if (articleCount > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '该标签仍关联文章，无法删除。'
      })
    }

    await prisma.tag.delete({
      where: { id }
    })

    return true
  })

  if (dbDeleted !== null) {
    return dbDeleted
  }

  const state = await readFallbackState()

  if (state.articles.some((article) => article.tagIds.includes(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: '该标签仍关联文章，无法删除。'
    })
  }

  const nextTags = state.tags.filter((tag) => tag.id !== id)

  if (nextTags.length === state.tags.length) {
    return false
  }

  state.tags = nextTags
  await writeFallbackStateSafely(state)
  return true
}

export async function listAdminProjects() {
  const dbProjects = await runWithPrisma(async (prisma) => {
    const records = await prisma.project.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
    })

    return records.map(toProjectRecordFromDb).sort(sortProjects)
  })

  if (dbProjects) {
    return dbProjects
  }

  const state = await readFallbackState()
  return state.projects.map(toProjectRecordFromStored).sort(sortProjects)
}

export async function listPublicProjects() {
  const projects = await listAdminProjects()
  return projects.filter((project) => project.status !== 'ARCHIVED' || project.isFeatured)
}

export async function getAdminProjectById(id: string) {
  const dbProject = await runWithPrisma(async (prisma) => {
    const record = await prisma.project.findUnique({
      where: { id }
    })

    return record ? toProjectRecordFromDb(record) : null
  })

  if (dbProject) {
    return dbProject
  }

  const state = await readFallbackState()
  const project = state.projects.find((item) => item.id === id)
  return project ? toProjectRecordFromStored(project) : null
}

export async function createProject(payload: ProjectEditorPayload) {
  const normalized = normalizeProjectPayload(payload)

  const dbProject = await runWithPrisma(async (prisma) => {
    const existingBySlug = await prisma.project.findUnique({
      where: { slug: normalized.slug }
    })

    if (existingBySlug) {
      throw createError({
        statusCode: 409,
        statusMessage: `项目 slug “${normalized.slug}”已被占用。`
      })
    }

    if (normalized.isFeatured) {
      await prisma.project.updateMany({
        data: {
          isFeatured: false
        }
      })
    }

    const record = await prisma.project.create({
      data: {
        title: normalized.title,
        slug: normalized.slug,
        summary: normalized.summary,
        contentMd: normalized.contentMd || null,
        stack: normalized.stack,
        repoUrl: normalized.repoUrl || null,
        demoUrl: normalized.demoUrl || null,
        status: normalized.status,
        isFeatured: normalized.isFeatured,
        publishedAt: normalized.status === 'LIVE' ? new Date() : null
      }
    })

    return toProjectRecordFromDb(record)
  })

  if (dbProject) {
    return dbProject
  }

  const state = await readFallbackState()
  assertProjectSlugAvailable(state.projects, normalized.slug)

  const timestamp = new Date().toISOString()

  if (normalized.isFeatured) {
    state.projects = state.projects.map((project) => ({
      ...project,
      isFeatured: false
    }))
  }

  const project: StoredProject = {
    id: randomUUID(),
    title: normalized.title,
    slug: normalized.slug,
    summary: normalized.summary,
    contentMd: normalized.contentMd,
    stack: normalized.stack,
    repoUrl: normalized.repoUrl,
    demoUrl: normalized.demoUrl,
    status: normalized.status,
    isFeatured: normalized.isFeatured,
    publishedAt: normalized.status === 'LIVE' ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  state.projects.unshift(project)
  await writeFallbackStateSafely(state)
  return toProjectRecordFromStored(project)
}

export async function updateProject(id: string, payload: ProjectEditorPayload) {
  const normalized = normalizeProjectPayload(payload)

  const dbProject = await runWithPrisma(async (prisma) => {
    const existing = await prisma.project.findUnique({
      where: { id }
    })

    if (!existing) {
      return null
    }

    const existingBySlug = await prisma.project.findUnique({
      where: { slug: normalized.slug }
    })

    if (existingBySlug && existingBySlug.id !== id) {
      throw createError({
        statusCode: 409,
        statusMessage: `项目 slug “${normalized.slug}”已被占用。`
      })
    }

    if (normalized.isFeatured) {
      await syncFeaturedProjectStateWithPrisma(prisma, id)
    }

    const record = await prisma.project.update({
      where: { id },
      data: {
        title: normalized.title,
        slug: normalized.slug,
        summary: normalized.summary,
        contentMd: normalized.contentMd || null,
        stack: normalized.stack,
        repoUrl: normalized.repoUrl || null,
        demoUrl: normalized.demoUrl || null,
        status: normalized.status,
        isFeatured: normalized.isFeatured,
        publishedAt:
          normalized.status === 'LIVE'
            ? existing.publishedAt ?? new Date()
            : normalized.status === 'ARCHIVED'
              ? null
              : existing.publishedAt
      }
    })

    return toProjectRecordFromDb(record)
  })

  if (dbProject) {
    return dbProject
  }

  const state = await readFallbackState()
  const projectIndex = state.projects.findIndex((project) => project.id === id)

  if (projectIndex < 0) {
    return null
  }

  assertProjectSlugAvailable(state.projects, normalized.slug, id)

  const existing = state.projects[projectIndex]
  const timestamp = new Date().toISOString()

  if (normalized.isFeatured) {
    state.projects = state.projects.map((project) => ({
      ...project,
      isFeatured: project.id === id
    }))
  }

  const project: StoredProject = {
    ...existing,
    title: normalized.title,
    slug: normalized.slug,
    summary: normalized.summary,
    contentMd: normalized.contentMd,
    stack: normalized.stack,
    repoUrl: normalized.repoUrl,
    demoUrl: normalized.demoUrl,
    status: normalized.status,
    isFeatured: normalized.isFeatured,
    publishedAt:
      normalized.status === 'LIVE'
        ? existing.publishedAt || timestamp
        : normalized.status === 'ARCHIVED'
          ? null
          : existing.publishedAt,
    updatedAt: timestamp
  }

  state.projects.splice(projectIndex, 1, project)
  await writeFallbackStateSafely(state)
  return toProjectRecordFromStored(project)
}

export async function deleteProject(id: string) {
  const dbDeleted = await runWithPrisma(async (prisma) => {
    const existing = await prisma.project.findUnique({
      where: { id }
    })

    if (!existing) {
      return false
    }

    await prisma.project.delete({
      where: { id }
    })

    return true
  })

  if (dbDeleted !== null) {
    return dbDeleted
  }

  const state = await readFallbackState()
  const nextProjects = state.projects.filter((project) => project.id !== id)

  if (nextProjects.length === state.projects.length) {
    return false
  }

  state.projects = nextProjects
  await writeFallbackStateSafely(state)
  return true
}

interface GetContentDashboardOptions {
  allowFallback?: boolean
}

export async function getContentDashboard(
  options: GetContentDashboardOptions = {}
): Promise<DashboardResponse> {
  const { allowFallback = true } = options
  const config = useRuntimeConfig()

  if (!allowFallback && !config.databaseUrl) {
    throw createError({
      statusCode: 503,
      statusMessage:
        '后台仪表盘数据库未配置。由于已关闭本地回退，请先配置 DATABASE_URL。'
    })
  }

  const dbDashboard = await runWithPrisma(
    async (prisma) => {
      const [articles, topics, tags, projects] = await Promise.all([
        prisma.article.findMany({
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
          take: 4,
          include: {
            topic: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        }),
        prisma.topic.findMany({
          orderBy: {
            name: 'asc'
          },
          include: {
            _count: {
              select: {
                articles: true
              }
            }
          }
        }),
        prisma.tag.findMany({
          orderBy: {
            name: 'asc'
          },
          include: {
            _count: {
              select: {
                articles: true
              }
            }
          }
        }),
        prisma.project.findMany({
          orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
          take: 3
        })
      ])

      const totalArticles = await prisma.article.count()
      const draftArticles = await prisma.article.count({
        where: {
          status: 'DRAFT'
        }
      })
      const publishedArticles = await prisma.article.count({
        where: {
          status: 'PUBLISHED'
        }
      })
      const archivedArticles = await prisma.article.count({
        where: {
          status: 'ARCHIVED'
        }
      })
      const projectCount = await prisma.project.count()

      return {
        stats: {
          totalArticles,
          draftArticles,
          publishedArticles,
          archivedArticles,
          tagCount: tags.length,
          topicCount: topics.length,
          projectCount
        },
        recentArticles: articles.map(toDbArticleRecord),
        recentProjects: projects.map(toProjectRecordFromDb).sort(sortProjects),
        topics: topics.map(toTopicRecordFromDb),
        tags: tags.map(toTagRecordFromDb),
        storage: getStorageState()
      }
    },
    {
      fallbackOnError: allowFallback,
      operation: '后台仪表盘数据库查询'
    }
  )

  if (dbDashboard) {
    return dbDashboard
  }

  if (!allowFallback) {
    throw createError({
      statusCode: 503,
      statusMessage:
        '后台仪表盘数据库查询未返回数据，且当前已关闭本地回退。'
    })
  }

  const state = await readFallbackState()

  return {
    stats: {
      totalArticles: state.articles.length,
      draftArticles: state.articles.filter((article) => article.status === 'DRAFT').length,
      publishedArticles: state.articles.filter((article) => article.status === 'PUBLISHED').length,
      archivedArticles: state.articles.filter((article) => article.status === 'ARCHIVED').length,
      tagCount: state.tags.length,
      topicCount: state.topics.length,
      projectCount: state.projects.length
    },
    recentArticles: state.articles
      .slice()
      .sort(compareRecentItems)
      .slice(0, 4)
      .map((article) => toArticleRecord(state, article)),
    recentProjects: state.projects
      .map(toProjectRecordFromStored)
      .sort(sortProjects)
      .slice(0, 3),
    topics: state.topics
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((topic) => toTopicRecordFromStored(state, topic)),
    tags: state.tags
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((tag) => toTagRecordFromStored(state, tag)),
    storage: getStorageState()
  }
}
