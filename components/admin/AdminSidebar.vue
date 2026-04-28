<script setup lang="ts">
import {
  BrainCircuit,
  FolderKanban,
  Hash,
  LayoutDashboard,
  NotebookPen,
  Tags
} from 'lucide-vue-next'
import { adminNavigation } from '~/data/navigation'

const route = useRoute()

const resolveIcon = (to: string) => {
  switch (to) {
    case '/admin':
      return LayoutDashboard
    case '/admin/articles':
      return NotebookPen
    case '/admin/topics':
      return Hash
    case '/admin/tags':
      return Tags
    case '/admin/projects':
      return FolderKanban
    case '/admin#ai-ops':
      return BrainCircuit
    default:
      return LayoutDashboard
  }
}

const isActiveLink = (to: string) => {
  const [path, hash] = to.split('#')

  if (hash) {
    if (route.path !== path) {
      return false
    }

    return route.hash === `#${hash}`
  }

  if (route.path === path) {
    return true
  }

  if (path === '/admin') {
    return false
  }

  return route.path.startsWith(`${path}/`)
}
</script>

<template>
  <div class="space-y-4">
    <aside class="surface-frame overflow-x-auto p-4 lg:hidden">
      <div class="mb-4 space-y-2">
        <p class="eyebrow">后台导航</p>
        <h2 class="text-lg font-semibold tracking-tight">内容管理台</h2>
      </div>
      <nav class="flex min-w-max gap-2" aria-label="后台移动端导航">
        <NuxtLink
          v-for="item in adminNavigation"
          :key="item.to"
          :to="item.to"
          class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition"
          :class="
            isActiveLink(item.to)
              ? 'bg-accent/10 text-accent dark:bg-surface-strong/70 dark:text-ink-strong'
              : 'border border-line/[0.15] text-ink-soft hover:border-accent/30 hover:text-ink-strong'
          "
          :aria-current="isActiveLink(item.to) ? 'page' : undefined"
        >
          <component :is="resolveIcon(item.to)" class="size-4" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
      <div class="mt-4">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-soft transition hover:border-accent/30 hover:text-ink-strong"
        >
          返回前台
        </NuxtLink>
      </div>
    </aside>

    <aside class="surface-frame sticky top-6 hidden h-[calc(100vh-3rem)] flex-col p-4 lg:flex">
      <div class="mb-6 space-y-2 px-2">
        <p class="eyebrow">后台导航</p>
        <h2 class="text-xl font-semibold tracking-tight">内容管理台</h2>
        <p class="text-sm leading-6 text-ink-soft">
          统一管理文章、专题、标签和项目，并保持前后台内容同步展示
        </p>
      </div>

      <nav class="grid gap-2" aria-label="后台导航">
        <NuxtLink
          v-for="item in adminNavigation"
          :key="item.to"
          :to="item.to"
          class="flex items-center justify-between rounded-2xl px-4 py-3 transition"
          :class="
            isActiveLink(item.to)
              ? 'bg-accent/10 text-accent dark:bg-surface-strong/70 dark:text-ink-strong'
              : 'text-ink-soft hover:bg-surface-muted/70 hover:text-ink-strong dark:hover:bg-surface-muted/60'
          "
          :aria-current="isActiveLink(item.to) ? 'page' : undefined"
        >
          <span class="flex items-center gap-3">
            <component :is="resolveIcon(item.to)" class="size-4" />
            {{ item.label }}
          </span>
          <span class="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            {{ item.hint }}
          </span>
        </NuxtLink>
      </nav>

      <div
        class="mt-auto space-y-3 rounded-2xl border border-dashed border-accent/25 bg-accent/[0.08] p-4"
      >
        <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">快速跳转</p>
        <p class="text-sm leading-6 text-ink-soft">
          后台修改完成后，可直接返回前台检查展示效果，无需手动切换地址
        </p>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-full border border-accent/20 px-4 py-2 text-sm text-accent transition hover:bg-accent/10"
        >
          返回前台首页
        </NuxtLink>
      </div>
    </aside>
  </div>
</template>
