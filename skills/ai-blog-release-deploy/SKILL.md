---
name: ai-blog-release-deploy
description: "负责发布前环境检查、构建、数据库准备、部署执行、上线冒烟验证和回滚准备。Use when the user asks to deploy the AI blog, prepare production environment variables, run the release build, connect the production database, publish to the target platform, or verify the site after launch."
---

# AI Blog Release Deploy

## 目标

Ship the blog safely after the quality gate has passed.

## 能做什么

- 审查生产环境变量、数据库连接、存储配置和站点地址配置。
- 运行构建、生成 Prisma 客户端、准备数据库 schema 同步。
- 根据用户指定的目标环境执行部署或输出可执行部署脚本。
- 在部署后做基础冒烟验证，包括首页、后台登录、内容接口和静态资源。
- 准备回滚说明和发布记录。

## 不做什么

- 不在质量门禁未通过时强行发布。
- 不替用户猜测生产密钥、数据库地址或部署平台凭证。
- 不在部署阶段顺手引入新功能或新架构。

## 统一约束

- 先确认部署目标，再执行对应部署动作。
- 先确认数据库和环境变量，再运行发布构建。
- 保持密钥只存在于受控环境，不写死在仓库中。
- 保持上线后验证覆盖前台、后台和内容读取主链路。

## 主要输入

- `.env.example`
- `nuxt.config.ts`
- `package.json`
- `prisma/schema.prisma`
- 部署目标平台配置

## 工作流

1. 审查发布目标、环境变量和数据库前提。
2. 运行构建前检查和生产构建。
3. 准备 Prisma 与数据库的发布动作。
4. 执行部署或输出平台对应部署步骤。
5. 在生产或预发布环境做冒烟验证并记录结果。

## 输出

- 发布步骤或已完成的部署动作。
- 环境变量和数据库准备清单。
- 上线后冒烟验证结果和回滚提示。

## 完成标准

- 发布前提明确，构建与数据库动作可执行。
- 部署结果可验证，站点关键路径可访问。
- 出现问题时存在清晰的阻塞说明或回滚方案。

## 交接对象

- 将发布结果交回用户，不再自动进入新阶段。
