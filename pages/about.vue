<script setup lang="ts">
const timeline = [
  {
    year: '当前状态',
    title: '持续更新学习笔记与项目测评',
    detail: '正在补充开发笔记、踩坑记录与技术测评，逐步完善内容体系'
  },
  {
    year: '过往沉淀',
    title: '记录项目开发与复盘',
    detail: '把项目开发过程、难点解决与经验复盘整理成可回看的文章'
  },
  {
    year: '后续规划',
    title: '完善项目履历与站点闭环',
    detail: '补充项目完整开发链路、作品集说明，让内容更成体系'
  }
]

const focusAreas = [
  '【技术栈】Vue3 / Nuxt',
  'TypeScript',
  'Node / API',
  '浏览器与网络',
  '数据库与部署',
  'AI 辅助开发'
]

const profileSignals = [
  {
    label: '内容结构',
    value: '笔记 + 项目 + 专题',
    detail: '用统一的结构，沉淀开发笔记、项目复盘与专题内容'
  },
  {
    label: 'GitHub 作品集',
    value: '持续完善中',
    detail: '记录每个项目的源码、技术栈、上线演示与开发复盘，持续迭代更新'
  },
  {
    label: '项目展示',
    value: '记录从开发到上线的全过程',
    detail: '覆盖需求分析、开发难点、问题解决、部署上线与后续优化'
  }
]

const capabilityGroups = [
  {
    title: '前端工程方向',
    detail: '记录 Vue3 / Nuxt / TypeScript 相关的开发实践、组件设计、状态管理与性能优化',
    items: ['组件体系', '页面结构', '交互体验', '工程化']
  },
  {
    title: '后端与数据方向',
    detail: '记录 Node/后端接口开发、数据库设计、权限校验与部署运维的实践经验',
    items: ['接口设计', '数据库', '权限管控', '部署联调']
  },
  {
    title: 'AI 与内容工作流',
    detail: '探索 AI 辅助开发、内容生成与站内工具的实践，记录落地效果与优化过程',
    items: ['AI 辅助开发', '内容生成', '工具实践', '站内检索']
  }
]

const practiceTracks = [
  {
    title: 'GitHub 项目整理',
    detail: '集中展示每个项目的源码地址、技术栈、上线效果与核心实现说明，清晰呈现项目全貌'
  },
  {
    title: '开发过程沉淀',
    detail: '不只展示最终结果，更记录从需求分析、开发难点解决到部署上线的完整过程'
  },
  {
    title: '技术方向拓展',
    detail: '持续补充前后端开发实践、部署运维经验与 AI 辅助开发的落地尝试'
  },
  {
    title: '长期更新计划',
    detail: '保持笔记、项目复盘与专题内容的持续更新，让站点随开发经历一起成长'
  }
]

useSeoMeta({
  title: '关于',
  description: '查看个人技术博客定位、内容方向与项目记录'
})
</script>

<template>
  <div class="app-container app-section space-y-6">
    <div class="grid gap-6 xl:grid-cols-[1.1fr_0.72fr]">
      <AppSurface class="space-y-6">
        <p class="eyebrow">站点简介</p>
        <div class="space-y-4">
          <h1 class="text-[2.3rem] font-semibold tracking-tight leading-[1.03] md:text-[3.2rem]">
            用项目与笔记，记录我的前端、后端开发之路
          </h1>
          <p class="body-copy">
            这里是我的个人技术博客，主要用来记录项目开发过程、踩坑难点、优质实践与学习笔记。
          </p>
          <p class="body-copy">
            目前正在持续更新学习笔记、项目复盘与技术测评内容，会不断补充新的开发实践与思考。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <AppStatusPill v-for="area in focusAreas" :key="area">{{ area }}</AppStatusPill>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div
            v-for="item in profileSignals"
            :key="item.label"
            class="rounded-3xl border border-line/10 bg-surface-muted/50 p-5"
          >
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">{{ item.label }}</p>
            <h2 class="mt-3 panel-title-sm">{{ item.value }}</h2>
            <p class="mt-2 body-copy">{{ item.detail }}</p>
          </div>
        </div>
      </AppSurface>

      <AppSurface class="space-y-5">
        <p class="eyebrow">建设节奏</p>
        <div class="grid gap-5">
          <div
            v-for="item in timeline"
            :key="item.year"
            class="rounded-3xl border border-line/10 bg-surface-muted/50 p-5"
          >
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">{{ item.year }}</p>
            <h2 class="mt-3 panel-title">{{ item.title }}</h2>
            <p class="mt-2 body-copy">{{ item.detail }}</p>
          </div>
        </div>
      </AppSurface>
    </div>

    <div class="grid gap-5 xl:grid-cols-3">
      <AppSurface
        v-for="group in capabilityGroups"
        :key="group.title"
        class="space-y-5"
      >
        <div class="space-y-3">
          <p class="eyebrow">{{ group.title }}</p>
          <h2 class="panel-title">{{ group.title }}</h2>
          <p class="body-copy">{{ group.detail }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppStatusPill v-for="item in group.items" :key="item">{{ item }}</AppStatusPill>
        </div>
      </AppSurface>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <AppSurface class="space-y-5">
        <p class="eyebrow">GitHub 与项目履历</p>
        <div class="space-y-4">
          <h2 class="section-title">
            把项目从开发到上线的全过程，做成可追溯的开发履历
          </h2>
          <p class="body-copy">
            这里会完整记录每个项目的源码、开发过程、踩坑难点、部署流程与复盘总结，让开发经历形成完整的成长档案
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div
            v-for="item in practiceTracks"
            :key="item.title"
            class="rounded-3xl border border-line/10 bg-surface-muted/50 p-5"
          >
            <h3 class="panel-title-sm">{{ item.title }}</h3>
            <p class="mt-2 body-copy">{{ item.detail }}</p>
          </div>
        </div>
      </AppSurface>

      <AppSurface class="space-y-5">
        <p class="eyebrow">当前建设要点</p>
        <div class="space-y-4">
          <h2 class="panel-title">让开发记录、学习笔记与项目展示，形成完整的内容闭环</h2>
          <p class="body-copy">
            当前重点是把开发过程、笔记沉淀与项目复盘统一成清晰的内容结构，方便自己回看与他人参考
          </p>
        </div>
        <div class="grid gap-3">
          <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">内容呈现</p>
            <p class="mt-2 body-copy">优化文章、项目与专题的展示体验，让内容结构清晰、阅读顺畅</p>
          </div>
          <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">内容沉淀</p>
            <p class="mt-2 body-copy">持续补充开发笔记、踩坑记录与项目复盘，完善每个环节的经验沉淀</p>
          </div>
          <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">作品展示</p>
            <p class="mt-2 body-copy">逐步补全项目的开发过程、难点解决与上线效果，让每个作品都能体现完整的开发经历</p>
          </div>
        </div>
      </AppSurface>
    </div>
  </div>
</template>
