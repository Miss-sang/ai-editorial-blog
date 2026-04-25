<script setup lang="ts">
import { Database, House, LogOut, ShieldCheck, Sparkles } from 'lucide-vue-next'
import { useAdminSession } from '~/composables/useAdminSession'

const route = useRoute()
const { session, logout } = useAdminSession()

const heading = computed(() => {
  if (route.path.startsWith('/admin/articles')) {
    return '文章管理'
  }

  if (route.path.startsWith('/admin/topics')) {
    return '专题管理'
  }

  if (route.path.startsWith('/admin/tags')) {
    return '标签管理'
  }

  if (route.path.startsWith('/admin/projects')) {
    return '项目管理'
  }

  return '内容后台总览'
})

const handleLogout = async () => {
  await logout()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p class="eyebrow">后台工作台</p>
      <h1 class="text-[1.8rem] font-semibold tracking-tight leading-tight md:text-[2rem]">{{ heading }}</h1>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] bg-surface/80 px-4 py-2 text-sm text-ink-soft transition hover:border-accent/30 hover:text-ink-strong"
      >
        <House class="size-4" />
        返回前台
      </NuxtLink>
      <AppStatusPill tone="accent">
        <Sparkles class="size-3.5" />
        AI 能力已接入
      </AppStatusPill>
      <AppStatusPill>
        <Database class="size-3.5" />
        数据链路在线
      </AppStatusPill>
      <AppStatusPill tone="success">
        <ShieldCheck class="size-3.5" />
        {{ session.displayName || '维护者会话' }}
      </AppStatusPill>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] bg-surface/80 px-4 py-2 text-sm text-ink-soft transition hover:border-accent/30 hover:text-ink-strong"
        @click="handleLogout"
      >
        <LogOut class="size-4" />
        退出登录
      </button>
    </div>
  </div>
</template>
