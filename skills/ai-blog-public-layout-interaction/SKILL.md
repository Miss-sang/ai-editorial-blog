---
name: ai-blog-public-layout-interaction
description: "修复前台首页首屏全屏展示、导航栏布局、底部区域不可点击和基础交互问题，并统一公共布局在桌面端与移动端的表现。Use when the user asks to fix public layout, make the hero fill the viewport, repair click issues, adjust navigation style, or clean up responsive interaction bugs on the Nuxt front-end."
---

# AI Blog Public Layout Interaction

## 目标

Make the public site feel complete, clickable, and visually coherent before deeper content work continues.

## 能做什么

- 让首页核心首屏在视觉上撑满首屏高度。
- 调整公共导航栏的结构、间距、断点和样式。
- 排查并修复页面底部或某些区域不可点击的问题。
- 修正 `z-index`、`pointer-events`、`sticky`、`overflow` 等交互遮挡问题。
- 保证桌面端和移动端的基础交互一致可用。

## 不做什么

- 不负责文章、项目、专题内容迁移。
- 不直接重构后台页面或数据库模型。
- 不引入新的前端框架、动画库或大型 UI 组件库。

## 统一约束

- 保持公共壳层以 `layouts/default.vue`、`components/app/*` 为主。
- 优先修复真实点击问题，不通过删除整个视觉层来规避 bug。
- 保持视觉统一，不让首页和其他公共页风格断裂。
- 保持交互可访问性，避免只在视觉上“看起来可点”。

## 主要输入

- `pages/index.vue`
- `components/app/AppHeader.vue`
- `components/app/AppFooter.vue`
- `layouts/default.vue`
- `assets/styles/main.css`

## 工作流

1. 复现首页首屏高度和不可点击问题。
2. 逐项排查公共布局中的遮挡层、固定层、伪元素和响应式断点。
3. 修复首屏高度逻辑，使关键板块在首屏内完整展示。
4. 调整导航栏样式、移动端菜单和底部交互。
5. 验证首页、列表页、页脚链接和移动端菜单的可点击性。

## 输出

- 全屏化的首页首屏布局。
- 可正常点击的公共区域与页脚区域。
- 统一的公共导航视觉和响应式行为。

## 完成标准

- 首页中心主板块在首屏内完整展示，不再显得塌陷或半截。
- 页脚和底部公共区域可稳定点击。
- 导航栏在桌面端和移动端都布局合理、交互正常。

## 交接对象

- 将公共展示层交给 `ai-blog-content-pipeline`。
