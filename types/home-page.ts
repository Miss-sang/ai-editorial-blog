import type { ArticleRecord, ProjectRecord, TopicRecord } from '~/types/content-studio'

export interface HomeMetric {
  label: string
  value: string
  detail: string
}

export interface HomePageResponse {
  metrics: HomeMetric[]
  featuredArticle: ArticleRecord | null
  latestArticles: ArticleRecord[]
  featuredProject: ProjectRecord | null
  latestProjects: ProjectRecord[]
  topics: TopicRecord[]
  aiArticles: ArticleRecord[]
}
