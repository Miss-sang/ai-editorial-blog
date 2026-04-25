import type { LabItem } from '~/types/content'

export const labs: LabItem[] = [
  {
    id: 'lab-01',
    slug: 'ai-summary-composer',
    title: 'AI 摘要实验台',
    summary: '验证技术长文的摘要压缩、重点提炼和追问引导效果',
    status: 'Review',
    model: 'Longcat / 免费模型',
    scene: '阅读辅助'
  },
  {
    id: 'lab-02',
    slug: 'prompt-compare-desk',
    title: '提示词对比台',
    summary: '对比不同提示词结构、角色设定和输出格式对结果的影响',
    status: 'Draft',
    model: 'Longcat',
    scene: '写作辅助'
  }
]
