import type { ArticleRecord, TagRecord, TopicRecord } from '~/types/content-studio'

export interface PublicTopicPagePayload {
  topic: TopicRecord
  articles: ArticleRecord[]
}

export interface PublicTagPagePayload {
  tag: TagRecord
  articles: ArticleRecord[]
}
