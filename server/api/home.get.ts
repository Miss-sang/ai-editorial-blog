import { defineEventHandler } from 'h3'
import {
  listPublicArticles,
  listPublicProjects,
  listPublicTopics
} from '~/server/lib/content-studio'
import type { HomePageResponse } from '~/types/home-page'

function isAiRelatedArticle(title: string, topicName?: string | null, tags: string[] = []) {
  const haystack = [title, topicName || '', ...tags].join(' ').toLowerCase()
  return ['ai', '大模型', '模型', '智能体', '提示词', '平台'].some((keyword) =>
    haystack.includes(keyword.toLowerCase())
  )
}

export default defineEventHandler(async (): Promise<HomePageResponse> => {
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
        detail: '前台展示的文章全部来自真实内容链路。'
      },
      {
        label: '公开专题',
        value: String(topics.length),
        detail: '围绕前端、浏览器、网络、计算机基础与 AI 平台组织内容。'
      },
      {
        label: '项目案例',
        value: String(projects.length),
        detail: '项目区承接仓库地址、案例说明与上线状态。'
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
