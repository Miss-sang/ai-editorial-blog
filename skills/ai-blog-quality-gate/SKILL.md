---
name: ai-blog-quality-gate
description: "执行全站质量门禁，核验权限、导航、点击、布局、数据同步、中文文案和基础稳定性，并输出通过或阻塞结论。Use when the user asks for bug verification, full-project QA, regression checking, pre-release validation, or a severity-ordered issue list for the AI blog project."
---

# AI Blog Quality Gate

## 目标

Stop unstable code from reaching deployment or later-stage packaging.

## 能做什么

- 按流程核验登录权限、后台跳转、首页布局、点击问题、数据同步和中文文案。
- 运行 `lint`、`typecheck`、`build` 或其他项目内检查命令。
- 做关键路径回归，例如“后台创建 -> 前台展示”“未授权访问 -> 登录拦截”。
- 输出按严重级排序的问题清单、复现路径和阻塞结论。
- 对少量低风险问题做即时修补，再重新验证。

## 不做什么

- 不新增大功能。
- 不在问题未说明清楚时直接进入部署。
- 不跳过验证直接宣称“可上线”。

## 统一约束

- 先列问题，再写总结。
- 优先关注功能正确性、交互可用性和明显回归。
- 验证失败时必须说明阻塞原因和影响范围。
- 验证通过时也要说明覆盖范围和残留风险。

## 主要输入

- `package.json` 中的校验命令
- 前后台关键页面
- 内容流转相关 API 和页面
- 已完成的前序 skill 改动

## 工作流

1. 建立验证清单：权限、导航、布局、点击、数据链路、文案。
2. 运行静态检查和构建检查。
3. 按关键业务流做手工回归。
4. 记录发现的问题，并按严重程度排序。
5. 在通过门禁后才允许进入部署 skill。

## 输出

- 质量门禁结果：通过或阻塞。
- 问题清单、复现步骤、影响范围和修复状态。
- 已执行的检查项和未覆盖风险。

## 完成标准

- 核心校验命令可运行且无阻塞错误，或阻塞项被明确记录。
- 关键业务流全部核验。
- 对是否可进入部署给出明确结论。

## 交接对象

- 仅在通过门禁后交给 `ai-blog-release-deploy`。
