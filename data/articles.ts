import type { ArticleSummary } from '~/types/content'

export const articles: ArticleSummary[] = [
  {
    id: 'art-vue-communication',
    slug: 'vue3-typescript-component-communication',
    title: 'Vue 3 + TypeScript 组件通信实践',
    summary: '从 props、emits 到 composable，梳理中大型页面里最常见的组件协作方式',
    excerpt:
      '当页面拆分成多个组件后，最先失控的通常不是样式，而是数据流。组件通信的边界一旦模糊，维护成本会持续放大',
    category: 'Vue 3 与 TypeScript',
    level: '进阶',
    readingTime: '7 分钟',
    publishedAt: '2026-04-25',
    aiAngle: '适合继续扩展为 AI 阅读助手中的代码讲解案例',
    featured: true,
    tags: ['Vue 3', 'TypeScript', '组件通信']
  },
  {
    id: 'art-html-accessibility',
    slug: 'html-semantic-accessibility-checklist',
    title: 'HTML 语义化与可访问性检查清单',
    summary: '从标题层级、表单标签到键盘焦点，整理页面上线前最值得自查的基础项',
    excerpt:
      '语义化不是写几个 section 和 article 就结束了，它真正影响的是可读性、可维护性和无障碍体验',
    category: 'HTML 与 CSS',
    level: '基础',
    readingTime: '6 分钟',
    publishedAt: '2026-04-24',
    aiAngle: '可作为 AI 生成页面结构建议时的校验依据',
    tags: ['HTML', 'CSS', '可访问性']
  },
  {
    id: 'art-css-layout',
    slug: 'css-layout-flex-grid-strategy',
    title: 'CSS 布局从 Flex 到 Grid 的选择策略',
    summary: '什么时候该用 Flex，什么时候该用 Grid，如何避免布局补丁越修越多',
    excerpt:
      '布局方案选错后，后续的每一个样式补丁都像在填坑。理解一维和二维布局的边界，比死记属性更重要',
    category: 'HTML 与 CSS',
    level: '进阶',
    readingTime: '6 分钟',
    publishedAt: '2026-04-23',
    aiAngle: '适合配合视觉型页面生成或布局类提示词一起使用',
    tags: ['CSS', '布局', '响应式']
  },
  {
    id: 'art-es6-async',
    slug: 'es6-async-flow-promise-await',
    title: 'ES6+ 异步流程：Promise、async/await 与错误处理',
    summary: '把常见的异步写法放到同一张地图上，避免接口请求和状态切换出现不可控分支',
    excerpt:
      '异步代码最难的地方不在语法，而在于控制流程、边界和失败路径。把错误处理写清楚，代码才有长期维护价值',
    category: 'JavaScript / ES6+',
    level: '进阶',
    readingTime: '8 分钟',
    publishedAt: '2026-04-22',
    aiAngle: '适合延展到流式输出、请求取消和并发控制场景',
    tags: ['ES6+', 'JavaScript', '异步']
  },
  {
    id: 'art-browser-render',
    slug: 'browser-url-to-render-process',
    title: '浏览器从输入 URL 到页面渲染发生了什么',
    summary: '把 DNS、TCP、HTTP、解析、布局和绘制串成一条完整链路',
    excerpt:
      '只有把请求链路和渲染链路串起来理解，前端性能问题才不会停留在“多加缓存”这种口号层面',
    category: '浏览器原理',
    level: '进阶',
    readingTime: '9 分钟',
    publishedAt: '2026-04-21',
    aiAngle: '适合做成浏览器知识问答和可视化讲解素材',
    tags: ['浏览器', '网络', 'HTTP']
  },
  {
    id: 'art-http-cache',
    slug: 'http-cache-strategy-guide',
    title: 'HTTP 缓存与协商缓存实战梳理',
    summary: '从强缓存、协商缓存到前端发布策略，给页面性能优化一个可执行的缓存视角',
    excerpt:
      '缓存不是只看 Cache-Control 和 ETag，而是要结合资源类型、构建产物和部署方式一起判断',
    category: '计算机网络',
    level: '进阶',
    readingTime: '7 分钟',
    publishedAt: '2026-04-20',
    aiAngle: '适合沉淀为网络类问答模板和排障知识库',
    tags: ['网络', 'HTTP', '缓存']
  },
  {
    id: 'art-computer-basics',
    slug: 'frontend-computer-basics-process-thread-memory',
    title: '前端工程需要补的计算机基础：进程、线程与内存',
    summary: '用前端开发能直接感知的场景，重新理解进程、线程、事件循环和内存占用',
    excerpt:
      '很多“页面卡顿”问题本质上并不只属于浏览器 API，而是和线程模型、任务调度和内存行为直接相关',
    category: '计算机基础',
    level: '基础',
    readingTime: '8 分钟',
    publishedAt: '2026-04-19',
    aiAngle: '适合延展为性能排查知识图谱',
    tags: ['计算机基础', '线程', '性能优化']
  },
  {
    id: 'art-ai-platform',
    slug: 'ai-platform-selection-and-prompt-workflow',
    title: 'AI 工具选型与提示词工作流搭建',
    summary: '从模型能力、成本、可控性和落地方式出发，建立适合个人项目的 AI 使用框架',
    excerpt:
      'AI 工具不是越多越好，关键是先明确你要解决的是阅读、写作、检索还是自动化，再决定模型与工具的组合',
    category: 'AI 工具与工作流',
    level: '进阶',
    readingTime: '8 分钟',
    publishedAt: '2026-04-18',
    aiAngle: '直接服务 AI 专区与后续工具选型文章',
    tags: ['AI', '提示词', '工作流']
  }
]
