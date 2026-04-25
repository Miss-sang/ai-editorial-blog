---
name: ai-blog-chinese-copy-normalizer
description: "统一全站中文文案、状态标签、页面标题、按钮、输入框和格式规范，清理英文主导内容与 week 类演示表述。Use when the user asks to make the platform fully Chinese, normalize UI copy, map English status values to Chinese labels, or enforce consistent formatting across the Nuxt blog front-end and admin UI."
---

# AI Blog Chinese Copy Normalizer

## 目标

Make the platform read like one coherent Chinese product instead of a mixed demo shell.

## 能做什么

- 将用户可见的页面标题、按钮、搜索框、提示语、空态文案统一为中文。
- 清理 `Week 1`、`Week 2`、`Open Studio`、`Browse` 等英文主导演示表述。
- 为文章状态、项目状态、标签提示等枚举值建立中文展示映射。
- 统一标题层级、日期格式、输入框占位符和反馈文案风格。
- 同步修正 SEO 标题和页面描述中的英文演示语气。

## 不做什么

- 不翻译代码变量名、路由 slug、数据库字段名。
- 不强行翻译必要技术名词，例如 `Vue`、`TypeScript`、`HTML`。
- 不负责新增内容结构或修复复杂交互 bug。

## 统一约束

- 所有用户可见文案默认使用中文。
- 必要技术名词可保留英文，但句式仍以中文为主。
- 同类操作使用同类动词，例如“新建”“编辑”“删除”“发布”。
- 保持前后台文案风格一致，不让后台继续保留英文演示语言。

## 主要输入

- `app.config.ts`
- `data/navigation.ts`
- `pages/**/*.vue`
- `components/**/*.vue`
- `types/content-studio.ts`
- 与状态显示相关的计算属性和 UI 组件

## 工作流

1. 识别所有用户可见英文、周次字样和格式不一致内容。
2. 建立统一术语表、状态映射表和常用动作词表。
3. 批量替换页面标题、按钮、提示文案、空态和错误态。
4. 检查首页、后台、搜索、专题、项目、关于页的语言一致性。
5. 验证必要技术名词没有被误翻译。

## 输出

- 中文统一的前后台文案。
- 状态标签和格式规范映射。
- 全站主要页面的一致语言风格。

## 完成标准

- 全站不再出现明显英文主导内容和周次演示字样。
- 按钮、标题、搜索框、状态文案风格统一。
- 保留的英文仅限必要技术名词或代码标识。

## 交接对象

- 将统一文案交给 `ai-blog-quality-gate`。
