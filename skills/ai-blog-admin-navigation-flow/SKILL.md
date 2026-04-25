---
name: ai-blog-admin-navigation-flow
description: "优化后台导航流转，补充从后台返回前台、前台预览、常用入口跳转和页面间快速切换。Use when the user asks to improve admin navigation, add return-to-site links, add preview links for articles or projects, or remove manual URL switching inside the admin studio."
---

# AI Blog Admin Navigation Flow

## 目标

Reduce manual URL switching between the admin studio and the public site.

## 能做什么

- 在后台顶部栏、侧边栏或编辑页增加“返回前台”“查看首页”“预览文章/项目”等入口。
- 统一后台各页面的导航文案、按钮位置和跳转行为。
- 为文章、项目等内容编辑页补充上下文导航，缩短操作路径。
- 修正后台内部链接、hash 跳转和面包屑式回退逻辑。

## 不做什么

- 不重做整个后台视觉系统。
- 不修改文章、项目、专题的底层数据库结构。
- 不顺带处理前台布局、文案迁移或部署问题。

## 统一约束

- 保持现有后台布局 `layouts/admin.vue`、`components/admin/*` 结构稳定。
- 保持导航入口简洁，不堆叠无关操作按钮。
- 保持跳转到前台时使用真实前台路由，而不是临时占位链接。
- 保持按钮文案中文化并与全站统一。

## 主要输入

- `components/admin/AdminTopbar.vue`
- `components/admin/AdminSidebar.vue`
- `pages/admin/articles/[id].vue`
- `pages/admin/projects/[id].vue`
- `data/navigation.ts`

## 工作流

1. 审查后台全局导航和编辑页局部导航。
2. 识别用户需要频繁切换的前后台路径。
3. 增加稳定的前台返回和内容预览入口。
4. 统一后台导航标签、按钮层级和文案。
5. 验证桌面端、移动端和登录后首屏跳转是否正常。

## 输出

- 后台到前台的快速入口。
- 文章、项目等关键内容的预览跳转。
- 中文统一的后台导航结构。

## 完成标准

- 后台首页和关键编辑页都能一键返回前台。
- 内容编辑页存在与当前内容对应的预览入口，且路由正确。
- 用户不需要手动改地址栏才能在前后台之间切换。

## 交接对象

- 将后台流转体验交给 `ai-blog-public-layout-interaction`。
