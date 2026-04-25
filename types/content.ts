export interface NavItem {
  label: string
  to: string
  hint?: string
}

export interface HeroMetric {
  label: string
  value: string
  detail: string
}

export interface FeatureCallout {
  title: string
  description: string
  meta: string
}

export interface ArticleSummary {
  id: string
  slug: string
  title: string
  summary: string
  excerpt: string
  category: string
  level: string
  readingTime: string
  publishedAt: string
  aiAngle: string
  featured?: boolean
  tags: string[]
}

export interface LabItem {
  id: string
  slug: string
  title: string
  summary: string
  status: 'Live' | 'Draft' | 'Review'
  model: string
  scene: string
}

export interface ProjectItem {
  id: string
  slug: string
  title: string
  summary: string
  status: 'Building' | 'Live' | 'Archived'
  stack: string[]
  impact: string
}

export interface SearchEntry {
  id: string
  kind: 'Article' | 'Lab' | 'Project'
  title: string
  description: string
  href: string
  meta: string
}

export interface SearchResponse {
  query: string
  total: number
  entries: SearchEntry[]
}
