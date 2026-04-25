---
name: ai-blog-admin-access-control
description: "处理后台仅本人可登录、未授权弹窗提示、会话校验、登录页中文化和后台访问收口。Use when the user asks to restrict admin access to the owner only, add unauthorized-login modal behavior, remove fake registration paths, harden admin session flow, or normalize Chinese auth copy in this Nuxt blog project."
---

# AI Blog Admin Access Control

## 目标

Enforce owner-only admin access without introducing a full auth platform.

## 能做什么

- 限制后台仅允许指定管理员账号登录。
- 区分“非本人访问”与“本人密码错误”两类登录反馈。
- 为未授权访问提供中文弹窗或明确提示，例如“功能暂未开放”。
- 清理登录页默认演示账号密码、英文提示和误导性注册表达。
- 保持服务端 session、路由中间件和客户端状态一致。

## 不做什么

- 不实现注册、邀请制、OAuth、短信验证码或多角色 RBAC。
- 不引入第三方认证平台，除非用户明确改方案。
- 不把账号、密码、密钥或授权判断下放到前端。

## 统一约束

- 保持 `server/api/admin/auth/*`、`server/utils/admin-session.ts` 为权限主入口。
- 保持用户可见文案中文化，仅保留必要技术名词。
- 保持登录限制兼容当前 `ADMIN_*` 环境变量。
- 保持限流、防暴力尝试和中间件跳转可用。

## 主要输入

- `pages/admin/login.vue`
- `server/api/admin/auth/login.post.ts`
- `server/utils/admin-session.ts`
- `middleware/admin-auth.ts`
- `composables/useAdminSession.ts`

## 工作流

1. 审查当前登录接口、session cookie 和中间件跳转逻辑。
2. 将服务端登录失败原因拆成可控的业务类型，不暴露敏感细节。
3. 在登录页增加中文弹窗或提示态，拦截“非本人登录”。
4. 移除默认预填账号密码和任何“可注册”暗示。
5. 验证未登录、错误登录、本人正确登录、登录后刷新页面四类路径。

## 输出

- 仅本人可登录的后台权限收口。
- 中文化的登录提示、错误提示和未开放提示。
- 与现有 session 机制兼容的服务端判断和前端表现。

## 完成标准

- 非本人尝试登录时出现明确中文受限提示。
- 本人正确凭证可正常登录并进入后台。
- 未登录访问 `/admin` 会被稳定重定向到登录页。
- 登录页不再暴露演示账号密码或英文主导文案。

## 交接对象

- 将后台权限和登录闭环交给 `ai-blog-admin-navigation-flow`。
