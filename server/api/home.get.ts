import { defineEventHandler } from 'h3'
import {
  listPublicArticles,
  listPublicProjects,
  listPublicTopics
} from '~/server/lib/content-studio'
import { setPublicContentCacheHeaders } from '~/server/utils/public-cache'
import type { HomePageResponse } from '~/types/home-page'

function isAiRelatedArticle(title: string, topicName?: string | null, tags: string[] = []) {
  const haystack = [title, topicName || '', ...tags].join(' ').toLowerCase()
  return ['ai', '大模型', '模型', '智能体', '提示词', '平台'].some((keyword) =>
    haystack.includes(keyword.toLowerCase())
  )
}

export default defineEventHandler(async (event): Promise<HomePageResponse> => {
  setPublicContentCacheHeaders(event)

  const [articles, projects, topics] = await Promise.all([
    listPublicArticles(),
    listPublicProjects(),
    listPublicTopics()
  ])

  const featuredArticle = articles.find((item) => item.isFeatured) ?? articles[0] ?? null
  const featuredProject = projects.find((item) => item.isFeatured) ?? projects[0] ?? null
  const aiArticles = articles.filter((article) =>
    isAiRelatedArticle(
      article.title,
      article.topic?.name,
      article.tags.map((tag) => tag.name)
    )
  )

  return {
    metrics: [
      {
        label: '已发布文章',
        value: String(articles.length),
        detail: '发布后的文章会同步到首页和归档。'
      },
      {
        label: '公开专题',
        value: String(topics.length),
        detail: '按文章分类整理阅读路径。'
      },
      {
        label: '项目案例',
        value: String(projects.length),
        detail: '记录案例说明、技术栈与上线状态。'
      }
    ],
    featuredArticle,
    latestArticles: articles.slice(0, 4),
    featuredProject,
    latestProjects: projects.slice(0, 3),
    topics: topics.slice(0, 6),
    aiArticles: aiArticles.slice(0, 3)
  }
})
