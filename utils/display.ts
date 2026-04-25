import type {
  ArticleStatus,
  ArticleStatusAction,
  ProjectStatus
} from '~/types/content-studio'

const articleStatusLabels: Record<ArticleStatus, string> = {
  DRAFT: '草稿',
  REVIEW: '待审核',
  PUBLISHED: '已发布',
  ARCHIVED: '已归档'
}

const projectStatusLabels: Record<ProjectStatus, string> = {
  BUILDING: '开发中',
  LIVE: '已上线',
  ARCHIVED: '已归档'
}

const articleActionLabels: Record<ArticleStatusAction, string> = {
  MOVE_TO_DRAFT: '转为草稿',
  MOVE_TO_REVIEW: '提交审核',
  PUBLISH: '立即发布',
  ARCHIVE: '归档'
}

export function getArticleStatusLabel(status: ArticleStatus) {
  return articleStatusLabels[status]
}

export function getProjectStatusLabel(status: ProjectStatus) {
  return projectStatusLabels[status]
}

export function getArticleActionLabel(action: ArticleStatusAction) {
  return articleActionLabels[action]
}

export function formatDisplayDate(value?: string | null, fallback = '未发布') {
  if (!value) {
    return fallback
  }

  return new Date(value).toLocaleDateString('zh-CN')
}

export function formatDisplayDateTime(value?: string | null, fallback = '尚未保存') {
  if (!value) {
    return fallback
  }

  return new Date(value).toLocaleString('zh-CN')
}

export function getSearchKindLabel(kind: 'Article' | 'Lab' | 'Project' | string) {
  if (kind === 'Article') {
    return '文章'
  }

  if (kind === 'Lab') {
    return 'AI 平台'
  }

  if (kind === 'Project') {
    return '项目'
  }

  return kind
}
