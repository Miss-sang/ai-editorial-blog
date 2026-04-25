import type { ProjectItem } from '~/types/content'

export const projects: ProjectItem[] = [
  {
    id: 'proj-blog-platform',
    slug: 'zhizhan-tech-blog-platform',
    title: '知栈技术博客平台',
    summary: '一个以前端体验为主导的技术内容平台，包含后台内容管理、数据库同步和 AI 阅读辅助',
    status: 'Building',
    stack: ['Nuxt 3', 'TypeScript', 'Tailwind', 'Prisma', 'Supabase'],
    impact: '承接文章、项目、专题、标签与 AI 阅读助手的完整业务链路'
  },
  {
    id: 'proj-browser-handbook',
    slug: 'browser-performance-handbook',
    title: '浏览器性能排查手册页',
    summary: '把渲染、缓存、请求链路和常见排查策略整理成可检索的专题页面',
    status: 'Live',
    stack: ['Vue 3', 'TypeScript', 'Markdown'],
    impact: '作为浏览器原理与性能优化内容的案例补充'
  },
  {
    id: 'proj-ai-prompt-lab',
    slug: 'ai-prompt-lab',
    title: 'AI 提示词实验台',
    summary: '对比不同提示词结构、输出格式和任务链拆分方式的实验界面',
    status: 'Live',
    stack: ['Nuxt 3', 'OpenAI', 'Tailwind'],
    impact: '为 AI 专区提供更贴近实战的提示词案例'
  }
]
