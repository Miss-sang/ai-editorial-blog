---
name: ai-blog-content-taxonomy-seeding
description: "清理与技术博客无关的演示内容，建立技术专题、标签、项目和 AI 平台内容体系，并准备首批可展示的结构化内容。Use when the user asks to remove unrelated copy like week labels, define the blog taxonomy, seed topic and tag data, migrate demo content into real technical categories, or prepare initial projects and profile content for the public site."
---

# AI Blog Content Taxonomy Seeding

## 目标

Replace demo-oriented content with a credible technical blog information architecture.

## 能做什么

- 删除与技术博客无关的演示字样、周次字样和偏占位内容。
- 建立专题、标签、项目和个人信息的内容组织结构。
- 规划并落地首批技术主题，例如 `Vue3 + TypeScript`、`HTML`、`CSS`、`ES6+`、浏览器、网络、计算机基础、AI 平台。
- 为项目板块准备 GitHub 项目、简介、创建信息等结构化内容。
- 将旧演示内容映射到新专题体系，或明确清理。

## 不做什么

- 不批量生成低质量长文凑数。
- 不伪造 GitHub 链接、项目成果或无法验证的个人经历。
- 不改变已经稳定的数据链路和权限链路。

## 统一约束

- 保持内容结构服务于技术博客定位，而不是泛资讯站。
- 保持分类层级简洁：专题稳定、标签灵活、项目独立。
- 保持中文主导表达，仅保留必要技术名词。
- 保持内容与数据库字段、公共路由和搜索入口兼容。

## 主要输入

- `data/articles.ts`
- `data/projects.ts`
- `data/labs.ts`
- `data/navigation.ts`
- `server/lib/content-studio.ts`
- `pages/about.vue`
- 后台文章、专题、标签、项目管理页面

## 工作流

1. 识别所有不相关或过度演示化的内容。
2. 设计目标专题、标签和项目结构，并建立映射关系。
3. 决定哪些内容保留、改写、迁移或删除。
4. 将首批结构化内容写入当前内容源。
5. 验证专题页、搜索页、项目页和首页推荐区是否能正确呈现新体系。

## 输出

- 技术博客专用的内容分类体系。
- 首批专题、标签、项目和个人信息内容。
- 清理名单、迁移名单和保留名单。

## 完成标准

- 全站不再出现与博客定位无关的周次演示内容。
- 前台能看到清晰的技术专题结构和项目结构。
- 搜索、专题、项目等入口能覆盖新的内容体系。

## 交接对象

- 将内容结构和首批数据交给 `ai-blog-chinese-copy-normalizer`。
