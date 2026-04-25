import type { FeatureCallout, HeroMetric } from '~/types/content'

export const heroMetrics: HeroMetric[] = [
  {
    label: '内容方向',
    value: '前端 / 计算机 / AI',
    detail: '围绕前端技术、计算机基础和 AI 内容持续更新'
  },
  {
    label: '核心流程',
    value: '后台 -> 数据库 -> 前台',
    detail: '后台创建后自动入库，再由前台统一展示'
  },
  {
    label: '内容形态',
    value: '文章 + 项目 + 专题',
    detail: '文章承接知识沉淀，项目承接实践案例，专题承接结构化导航'
  }
]

export const featuredCallouts: FeatureCallout[] = [
  {
    title: 'AI 阅读助手',
    description: '为文章生成摘要、解释划词内容，并继续追问实现细节',
    meta: '服务当前文章阅读场景'
  },
  {
    title: '后台内容台',
    description: '统一维护文章、专题、标签与项目，打通前后台展示链路',
    meta: '支撑内容创建与发布流转'
  },
  {
    title: '站内搜索',
    description: '聚合文章、AI 入口和项目案例，提供统一检索入口',
    meta: '支撑公共内容发现'
  }
]
