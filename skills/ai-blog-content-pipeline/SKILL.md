---
name: ai-blog-content-pipeline
description: "打通后台创建、数据库存储、前台展示的内容闭环，统一首页和公共页面的数据源，清理静态演示数据入口。Use when the user asks to connect admin CRUD to the database and public pages, replace static seed imports with live APIs, add home aggregation endpoints, or enforce the real content pipeline in this Nuxt + Prisma blog."
---

# AI Blog Content Pipeline

## 目标

Make the database-backed content flow the single operational path for the blog.

## 能做什么

- 统一后台写入、数据库存储和前台读取的闭环。
- 替换首页和公共页对 `data/*.ts` 静态演示数据的直接依赖。
- 补充首页聚合接口，例如 `/api/home`，用于首屏和推荐区读取真实内容。
- 约束生产环境的数据源策略，避免发布后仍依赖本地 JSON fallback。
- 校验后台新增文章、项目、专题、标签后前台是否能同步展示。

## 不做什么

- 不引入外部 CMS、消息队列、搜索引擎服务或多仓拆分。
- 不把数据库 schema 扩展到超出当前需求的复杂平台级形态。
- 不顺带生成大量内容文案或做全站中文化。

## 统一约束

- 优先以 `server/lib/content-studio.ts` 为内容中台入口。
- 优先以 `Prisma + PostgreSQL` 为主数据源。
- 保持公共 API 返回结构稳定，避免前台多处重复拼装。
- 保持前台 SSR/CSR 下都能读到一致数据。

## 主要输入

- `server/lib/content-studio.ts`
- `server/api/articles/*`
- `server/api/projects/*`
- `server/api/topics/*`
- `pages/index.vue`
- `pages/labs.vue`
- `server/api/search.get.ts`

## 工作流

1. 审查哪些页面仍在直接读取 `data/*.ts`。
2. 补充或改造公共 API，使首页和公共页读取真实内容源。
3. 将首页、搜索页、实验页等入口迁移到统一数据链路。
4. 明确生产环境是否允许 fallback；不允许时给出阻断。
5. 用后台创建一条真实数据验证“创建 -> 存储 -> 展示”闭环。

## 输出

- 统一的数据源接入方案。
- 首页与公共页的真实内容聚合接口。
- 从后台到前台的可验证内容流转闭环。

## 完成标准

- 后台新增的文章、项目、专题等内容能在前台相应区域展示。
- 首页不再依赖本地静态演示数据渲染核心内容。
- 公共页面读到的内容与后台列表保持一致。

## 交接对象

- 将真实数据链路交给 `ai-blog-content-taxonomy-seeding`。
