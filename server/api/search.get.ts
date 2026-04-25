import { defineEventHandler, getQuery } from 'h3'
import { listPublicArticles, listPublicProjects } from '~/server/lib/content-studio'
import { recordSearchQuery } from '~/server/lib/telemetry'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { getProjectStatusLabel } from '~/utils/display'
import type { SearchEntry, SearchResponse } from '~/types/content'

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase()
}

function buildSearchIndex(entries: SearchEntry[]) {
  return entries.map((entry) => {
    const searchableText = normalizeSearchText(
      [entry.title, entry.description, entry.meta, entry.kind].join(' ')
    )

    return {
      entry,
      searchableText
    }
  })
}

function getSearchScore(entry: SearchEntry, searchableText: string, query: string) {
  if (!query) {
    return 0
  }

  const title = normalizeSearchText(entry.title)
  const description = normalizeSearchText(entry.description)
  const meta = normalizeSearchText(entry.meta)
  const keywords = query.split(/\s+/u).filter(Boolean)

  return keywords.reduce((score, keyword) => {
    let nextScore = score

    if (title.startsWith(keyword)) {
      nextScore += 10
    }

    if (title.includes(keyword)) {
      nextScore += 6
    }

    if (description.includes(keyword)) {
      nextScore += 3
    }

    if (meta.includes(keyword)) {
      nextScore += 2
    }

    if (searchableText.includes(keyword)) {
      nextScore += 1
    }

    return nextScore
  }, 0)
}

function isAiArticle(entry: { title: string; description: string; meta: string }) {
  const haystack = [entry.title, entry.description, entry.meta].join(' ').toLowerCase()
  return ['ai', '大模型', '模型', '平台', '提示词', '智能体'].some((keyword) =>
    haystack.includes(keyword.toLowerCase())
  )
}

export default defineEventHandler(async (event): Promise<SearchResponse> => {
  assertRateLimit(event, {
    bucket: 'public-search',
    limit: 90,
    windowMs: 10 * 60 * 1000,
    message: ({ retryAfter }) => `搜索过于频繁，请在 ${retryAfter} 秒后重试。`
  })

  const rawQuery = String(getQuery(event).q || '')
  const query = normalizeSearchText(rawQuery)
  const [articles, projects] = await Promise.all([listPublicArticles(), listPublicProjects()])

  const aiArticleCount = articles.filter((article) =>
    isAiArticle({
      title: article.title,
      description: article.summary,
      meta: `${article.topic?.name || ''} ${article.tags.map((tag) => tag.name).join(' ')}`
    })
  ).length

  const entries: SearchEntry[] = [
    ...articles.map((article) => ({
      id: article.id,
      kind: 'Article' as const,
      title: article.title,
      description: article.summary,
      href: `/articles/${article.slug}`,
      meta: `${article.topic?.name || '未分配专题'} / ${article.readingTime} 分钟`
    })),
    {
      id: 'ai-platform-hub',
      kind: 'Lab' as const,
      title: 'AI 平台专区',
      description: '集中查看 AI 平台、模型工具和相关文章入口。',
      href: '/labs',
      meta: `${aiArticleCount} 篇相关文章 / AI 平台导航`
    },
    ...projects.map((project) => ({
      id: project.id,
      kind: 'Project' as const,
      title: project.title,
      description: project.summary,
      href: `/projects#${project.slug}`,
      meta: `${getProjectStatusLabel(project.status)} / ${project.stack.join(' / ') || '项目案例'}`
    }))
  ]

  const indexedEntries = buildSearchIndex(entries)
  const filteredEntries = indexedEntries
    .filter(({ searchableText }) => !query || searchableText.includes(query))
    .sort((left, right) => {
      const scoreDelta =
        getSearchScore(right.entry, right.searchableText, query) -
        getSearchScore(left.entry, left.searchableText, query)

      if (scoreDelta !== 0) {
        return scoreDelta
      }

      return left.entry.title.localeCompare(right.entry.title)
    })
    .map(({ entry }) => entry)

  const response = {
    query,
    total: filteredEntries.length,
    entries: filteredEntries
  }

  await recordSearchQuery(event, {
    query: rawQuery,
    resultCount: response.total
  })

  return response
})
