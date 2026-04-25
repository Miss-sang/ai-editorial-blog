import type { NavItem } from '~/types/content'

export const publicNavigation: NavItem[] = [
  { label: '文章', to: '/articles', hint: '技术文章归档' },
  { label: '专题', to: '/topics', hint: '知识导航地图' },
  { label: 'AI', to: '/labs', hint: 'AI 工具与内容' },
  { label: '项目', to: '/projects', hint: '案例与仓库' },
  { label: '搜索', to: '/search', hint: '站内检索' },
  { label: '关于', to: '/about', hint: '个人介绍' }
]

export const adminNavigation: NavItem[] = [
  { label: '总览', to: '/admin', hint: '内容台总控' },
  { label: '文章', to: '/admin/articles', hint: '草稿与发布' },
  { label: '专题', to: '/admin/topics', hint: '主知识结构' },
  { label: '标签', to: '/admin/tags', hint: '辅助检索标记' },
  { label: '项目', to: '/admin/projects', hint: '项目案例管理' },
  { label: '系统状态', to: '/admin#ai-ops', hint: '服务与运行状态' }
]
