<script setup lang="ts">
const timeline = [
  {
    year: '现在',
    title: '持续建设中文技术主站',
    detail: '围绕前端、后端、AI 与项目履历持续扩充内容体系'
  },
  {
    year: '此前',
    title: '沉淀学习笔记与项目复盘',
    detail: '把零散记录整理成可发布、可检索、可复用的知识资产'
  },
  {
    year: '下一步',
    title: '扩展 GitHub 作品集与全站工作流',
    detail: '继续补齐作品说明、项目履历、部署链路和 AI 阅读辅助'
  }
]

const focusAreas = [
  'Vue 3 / Nuxt',
  'TypeScript',
  'Node / API',
  '浏览器与网络',
  '数据库与部署',
  'AI 工作流'
]

const profileSignals = [
  {
    label: '内容结构',
    value: '文章 + 项目 + 专题',
    detail: '把知识沉淀、作品展示和导航结构放进同一套站点体系'
  },
  {
    label: 'GitHub 作品集',
    value: '持续更新',
    detail: '用源码、技术栈、演示地址和复盘说明串起完整作品集'
  },
  {
    label: '项目履历',
    value: '从练习到上线',
    detail: '覆盖需求拆分、界面实现、接口联调、部署发布和后续迭代'
  }
]

const capabilityGroups = [
  {
    title: '前端工程方向',
    detail: '围绕 Vue 3、Nuxt、TypeScript、组件通信、状态管理、CSS 架构和性能优化持续输出',
    items: ['组件体系', '页面结构', '交互体验', '工程化']
  },
  {
    title: '后端与数据方向',
    detail: '补齐接口设计、数据库建模、内容存储、权限校验、部署配置和运行状态监控',
    items: ['接口设计', '数据库', '权限管控', '部署联调']
  },
  {
    title: 'AI 与内容工作流',
    detail: '把 AI 阅读、流式问答、内容生成辅助与站内搜索结合进真实阅读和运营场景',
    items: ['AI 阅读', '流式输出', '内容辅助', '站内检索']
  }
]

const practiceTracks = [
  {
    title: 'GitHub 作品集整理',
    detail: '把每个项目的源码地址、技术栈说明、界面截图、上线地址和核心实现拆解集中到统一展示页'
  },
  {
    title: '项目履历沉淀',
    detail: '不只展示结果，还记录每个项目从需求理解、界面搭建、接口联调到部署上线的完整过程'
  },
  {
    title: '全站技术方向扩展',
    detail: '在前端内容之外继续补充 Node 服务、数据库、全站工作流与 AI 自动化实践'
  },
  {
    title: '长期维护节奏',
    detail: '保持文章更新、项目归档、专题梳理和后台工作流同步推进，让站点持续可维护'
  }
]

useSeoMeta({
  title: '关于',
  description: '查看站点定位、内容方向、作品集规划与个人技术关注点'
})
</script>

<template>
  <div class="app-container app-section space-y-6">
    <div class="grid gap-6 xl:grid-cols-[1.1fr_0.72fr]">
      <AppSurface class="space-y-6">
        <p class="eyebrow">站点简介</p>
        <div class="space-y-4">
          <h1 class="text-[2.3rem] font-semibold tracking-tight leading-[1.03] md:text-[3.2rem]">
            用项目、文章和 GitHub 作品集持续沉淀前端、后端与 AI 能力
          </h1>
          <p class="body-copy">
            这个博客既是技术笔记系统，也是项目作品集，同时承担前端、后端、部署链路和 AI 内容工作流的长期沉淀任务
          </p>
          <p class="body-copy">
            我会把 Vue 3、TypeScript、浏览器与网络、Node 接口、数据库、部署实践以及 GitHub 项目履历统一整理进同一套中文内容结构，让站点既能阅读，也能展示真实做过的项目
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
            把源码、页面、部署与复盘串成连续可读的项目履历
          </h2>
          <p class="body-copy">
            后续会把 GitHub 仓库、项目演示、功能拆解、技术栈选择、页面截图和复盘说明一起补齐，让每个项目都能形成完整的作品档案，而不是只留下一个仓库地址
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
        <p class="eyebrow">当前建设重点</p>
        <div class="space-y-4">
          <h2 class="panel-title">让技术内容、后台流程和作品展示形成统一闭环</h2>
          <p class="body-copy">
            当前重点不是单独做一页漂亮界面，而是把前台阅读、后台录入、数据库存储、AI 阅读辅助和项目展示统一到稳定结构中
          </p>
        </div>
        <div class="grid gap-3">
          <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">前端</p>
            <p class="mt-2 body-copy">继续优化首页、列表页、详情页和导航体验，让站点保持清晰统一的视觉语言</p>
          </div>
          <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">后台</p>
            <p class="mt-2 body-copy">补齐内容录入、权限校验、状态切换和服务配置展示，让后台真正服务内容生产</p>
          </div>
          <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">作品集</p>
            <p class="mt-2 body-copy">逐步补入 GitHub 项目、上线案例、技术选型说明和项目履历，让作品展示更有说服力</p>
          </div>
        </div>
      </AppSurface>
    </div>
  </div>
</template>
