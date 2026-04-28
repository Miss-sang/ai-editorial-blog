import type { FeatureCallout, HeroMetric } from '~/types/content'

export const heroMetrics: HeroMetric[] = [
  {
    label: '内容方向',
    value: '前端 / 后端',
    detail: '记录开发中的问题、实现和复盘'
  },
  {
    label: '核心流程',
    value: '后台 -> 数据 -> 前台',
    detail: '内容发布后统一展示'
  },
  {
    label: '内容模块',
    value: '文章 + 项目 + 专题',
    detail: '文章记录问题，项目记录实践，专题组织路径'
  }
]

export const featuredCallouts: FeatureCallout[] = [
  {
    title: 'AI 阅读助手',
    description: '为文章提供摘要、划词解释和追问入口',
    meta: '服务文章阅读'
  },
  {
    title: '后台内容台',
    description: '维护文章、专题、标签与项目',
    meta: '支撑内容发布'
  },
  {
    title: '站内搜索',
    description: '聚合文章、专题和项目入口',
    meta: '支撑内容查找'
  }
]
