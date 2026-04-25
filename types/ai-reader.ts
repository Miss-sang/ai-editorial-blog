export interface ArticleAiSummaryResponse {
  provider: 'longcat'
  articleSlug: string
  model: string
  summary: string
  takeaways: string[]
  followUps: string[]
  generatedAt: string
}

export interface ArticleAiAnswerResponse {
  provider: 'longcat'
  articleSlug: string
  model: string
  answer: string
  supportingPoints: string[]
  followUps: string[]
  generatedAt: string
}

export interface ArticleAiExplainResponse {
  provider: 'longcat'
  articleSlug: string
  model: string
  selection: string
  explanation: string
  relatedConcepts: string[]
  generatedAt: string
}

export interface ArticleAiStreamResponse {
  provider: 'longcat'
  articleSlug: string
  model: string
  answer: string
  generatedAt: string
}
