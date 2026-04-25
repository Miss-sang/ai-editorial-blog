export const articleStatusOptions = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] as const
export const articleStatusActionOptions = [
  'MOVE_TO_DRAFT',
  'MOVE_TO_REVIEW',
  'PUBLISH',
  'ARCHIVE'
] as const
export const projectStatusOptions = ['BUILDING', 'LIVE', 'ARCHIVED'] as const

export type ArticleStatus = (typeof articleStatusOptions)[number]
export type ArticleStatusAction = (typeof articleStatusActionOptions)[number]
export type ProjectStatus = (typeof projectStatusOptions)[number]

export interface AdminSessionState {
  authenticated: boolean
  email: string | null
  displayName: string | null
}

export interface TopicRecord {
  id: string
  name: string
  slug: string
  description?: string | null
  articleCount: number
  createdAt: string
  updatedAt: string
}

export interface TagRecord {
  id: string
  name: string
  slug: string
  color?: string | null
  articleCount: number
  createdAt: string
  updatedAt: string
}

export interface ProjectRecord {
  id: string
  title: string
  slug: string
  summary: string
  contentMd: string
  stack: string[]
  repoUrl: string
  demoUrl: string
  status: ProjectStatus
  isFeatured: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ArticleRecord {
  id: string
  title: string
  slug: string
  summary: string
  excerpt: string
  bodyMd: string
  coverImageUrl: string
  readingTime: number
  status: ArticleStatus
  isFeatured: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  seoTitle: string
  seoDescription: string
  topic: TopicRecord | null
  tags: TagRecord[]
}

export interface TopicEditorPayload {
  name: string
  description: string
}

export interface TagEditorPayload {
  name: string
  color: string
}

export interface ArticleEditorPayload {
  title: string
  slug: string
  summary: string
  excerpt: string
  bodyMd: string
  coverImageUrl: string
  status: ArticleStatus
  isFeatured: boolean
  topicName: string
  tagNames: string[]
  seoTitle: string
  seoDescription: string
}

export interface ProjectEditorPayload {
  title: string
  slug: string
  summary: string
  contentMd: string
  stack: string[]
  repoUrl: string
  demoUrl: string
  status: ProjectStatus
  isFeatured: boolean
}

export interface ArticleStatusActionPayload {
  action: ArticleStatusAction
}

export interface DashboardStats {
  totalArticles: number
  draftArticles: number
  publishedArticles: number
  archivedArticles: number
  tagCount: number
  topicCount: number
  projectCount: number
}

export interface DashboardResponse {
  stats: DashboardStats
  recentArticles: ArticleRecord[]
  recentProjects: ProjectRecord[]
  topics: TopicRecord[]
  tags: TagRecord[]
  storage: {
    driver: 'supabase' | 'inline'
    configured: boolean
  }
}

export interface UploadResult {
  url: string
  path: string
  provider: 'supabase' | 'inline'
}
