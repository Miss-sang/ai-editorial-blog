---
name: ai-blog-change-orchestrator
description: "统筹 AI 技术博客九段式改造流程，负责拆分任务、判定当前应执行的 skill、校验依赖顺序、统一完成标准，并在后台权限、后台导航、前台布局、数据流转、内容迁移、中文化、质量验收、部署之间做衔接。Use when the user asks for overall execution order, current phase selection, cross-skill coordination, dependency gating, or stage-by-stage implementation for this Nuxt 3 + Prisma blog project."
---

# AI Blog Change Orchestrator

## 目标

Keep the nine-skill execution plan ordered, narrow, and verifiable.

## 能做什么

- 识别当前项目处于哪一个改造阶段，并只激活一个主 skill。
- 检查前置条件、阻塞项、风险项和跨模块依赖。
- 统一每一阶段的输入、输出、验收标准和交接对象。
- 在执行中防止范围漂移，避免把多个大模块混在同一轮里。
- 在阶段完成后明确下一步应该切换到哪个 skill。

## 不做什么

- 不直接承担大规模页面改版、数据库改造或部署执行。
- 不在未满足前置条件时强行推进下一个 skill。
- 不引入新的技术栈、外部 CMS 或多服务拆分，除非用户明确要求。

## 统一约束

- 保持现有 `Nuxt 3 + TypeScript + Tailwind + Nitro API + Prisma` 架构。
- 优先以数据库为主数据源；仅在本地开发时容忍受控 fallback。
- 保持用户可见内容以中文为主，仅保留必要技术名词。
- 保持密钥仅在服务端使用，不覆盖无关改动。

## 执行顺序

1. `ai-blog-admin-access-control`
2. `ai-blog-admin-navigation-flow`
3. `ai-blog-public-layout-interaction`
4. `ai-blog-content-pipeline`
5. `ai-blog-content-taxonomy-seeding`
6. `ai-blog-chinese-copy-normalizer`
7. `ai-blog-quality-gate`
8. `ai-blog-release-deploy`

## 工作流

1. 审查需求、当前代码、数据库配置和未完成项。
2. 选择一个当前主 skill，并写清本轮边界。
3. 检查是否具备前置条件；不具备则先回退到更早的 skill。
4. 要求执行 skill 输出改动清单、验证结果、剩余风险和下一步建议。
5. 在通过验收前，不切换到后续阶段。

## 完成标准

- 当前活跃阶段被唯一确定。
- 本轮边界、验收口径、阻塞项和下一 skill 都被明确。
- 没有把多个不相关的大任务混入同一轮执行。

## 交接对象

- 将通过验收的阶段交接给执行顺序中的下一个 skill。
