# AI Editorial Blog

一个基于 Nuxt 3 的中文技术博客与后台内容管理系统，支持文章、专题、标签、项目、AI 辅助能力和前后台联动展示。

## 在线地址

- 前台首页：[https://ai-editorial-blog.vercel.app](https://ai-editorial-blog.vercel.app)
- 后台登录：[https://ai-editorial-blog.vercel.app/admin/login](https://ai-editorial-blog.vercel.app/admin/login)

## 项目简介

本项目面向中文技术内容发布场景，前台用于展示文章、项目、专题、标签与搜索内容，后台用于统一管理内容数据，并通过数据库完成前后台同步。整体目标是形成稳定的“后台创建 -> 数据库存储 -> 前台展示”内容链路。

## 主要功能

- 中文技术博客首页与内容聚合展示
- 文章列表、文章详情、相关文章推荐
- 专题、标签、项目页面与聚合浏览
- 全站搜索
- 后台登录鉴权
- 后台文章、项目、专题、标签管理
- 封面上传
- AI 文章摘要、划词解释、问答与流式输出接口
- 访问、搜索、AI 使用行为统计

## 技术栈

- 前端框架：Nuxt 3、Vue 3、TypeScript
- 样式方案：Tailwind CSS
- 数据层：Prisma + PostgreSQL
- 数据库与对象存储：Supabase
- AI 接口：Longcat 兼容 OpenAI 风格接口
- 部署平台：Vercel

## 页面结构

### 前台

- `/` 首页
- `/articles` 文章列表
- `/articles/[slug]` 文章详情
- `/projects` 项目列表
- `/topics` 专题列表
- `/topics/[slug]` 专题详情
- `/tags` 标签列表
- `/tags/[slug]` 标签详情
- `/search` 搜索页
- `/labs` AI / 实验内容页
- `/about` 介绍页

### 后台

- `/admin/login` 后台登录
- `/admin` 后台总览
- `/admin/articles` 文章管理
- `/admin/projects` 项目管理
- `/admin/topics` 专题管理
- `/admin/tags` 标签管理

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，然后填写真实配置：

```bash
cp .env.example .env
```

Windows PowerShell 可手动复制一份 `.env.example` 并重命名为 `.env`。

### 3. 生成 Prisma Client

```bash
npm run prisma:generate
```

### 4. 启动开发环境

```bash
npm run dev
```

如果 PowerShell 阻止执行 `npm.ps1`，可改用：

```bash
npm.cmd run dev
```

## 常用脚本

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
npm run typecheck
npm run prisma:generate
npm run prisma:push
npm run db:check:pg
npm run db:check:prisma
npm run db:create-prisma-role
npm run db:push:pg
npm run content:import
```

## 关键环境变量

以下变量为项目运行的核心配置：

```env
NUXT_PUBLIC_SITE_URL=
NUXT_PUBLIC_SITE_NAME=
NUXT_PUBLIC_SITE_DESCRIPTION=

NUXT_PUBLIC_SUPABASE_URL=
NUXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=blog-assets

DATABASE_URL=

LONGCAT_API_KEY=
LONGCAT_BASE_URL=https://api.longcat.chat/openai
LONGCAT_CHAT_MODEL=LongCat-Flash-Chat
LONGCAT_REASONING_MODEL=LongCat-Flash-Thinking

ADMIN_SESSION_SECRET=
ADMIN_LOGIN_EMAIL=
ADMIN_LOGIN_PASSWORD=
ADMIN_DISPLAY_NAME=
```

## 数据库说明

项目使用 Prisma 连接 PostgreSQL，并已适配 Supabase。

本地或部署时需要确保 `DATABASE_URL` 可用。对于 Vercel 这类 serverless 环境，建议使用 Supabase 的 transaction pooler 连接串，而不是 session pooler。

推荐格式：

```env
DATABASE_URL=postgres://prisma.<project-ref>:<db-password>@<region>.pooler.supabase.com:6543/postgres?connection_limit=1
```

如果需要初始化数据库结构，可使用：

```bash
npm run prisma:generate
npm run db:push:pg
```

如果需要导入内置内容数据，可使用：

```bash
npm run content:import
```

## 部署说明

### Vercel

1. 将仓库推送到 GitHub
2. 在 Vercel 中导入该 GitHub 仓库
3. 配置项目环境变量
4. 触发部署或重新部署

### 部署时建议重点检查

- `DATABASE_URL` 是否为可用的 Supabase 连接串
- `NUXT_PUBLIC_SITE_URL` 是否为正式域名
- `SUPABASE_SERVICE_ROLE_KEY` 是否已配置
- `ADMIN_LOGIN_EMAIL` 与 `ADMIN_LOGIN_PASSWORD` 是否已配置
- AI 相关变量是否已配置

## 目录参考

```text
.
├─ assets/                样式与静态资源
├─ components/            通用组件
├─ composables/           组合式逻辑
├─ data/                  初始内容数据
├─ layouts/               布局
├─ middleware/            中间件
├─ pages/                 页面路由
├─ plugins/               Nuxt 插件
├─ prisma/                Prisma schema
├─ scripts/               数据库与导入脚本
├─ server/                服务端 API 与核心逻辑
├─ skills/                项目任务拆分与执行技能定义
├─ types/                 类型定义
├─ utils/                 工具函数
└─ nuxt.config.ts         Nuxt 配置
```

## 适用场景

- 中文技术博客
- 个人内容站点
- 带后台的知识整理平台
- 技术文章与项目展示站
- 接入 AI 辅助阅读和问答能力的内容产品

## 备注

- 后台内容管理依赖数据库与管理员环境变量
- 上传能力依赖 Supabase 存储配置
- AI 能力依赖对应模型服务配置
- 若修改环境变量，Vercel 需要重新部署后才会生效
