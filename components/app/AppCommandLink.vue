<script setup lang="ts">
import { Command, Search } from 'lucide-vue-next'

const appConfig = useAppConfig()
</script>

<template>
  <NuxtLink
    to="/search"
    class="group inline-flex min-w-[12rem] max-w-[15rem] shrink-0 items-center gap-2.5 rounded-[7px] border border-line/[0.15] bg-surface/[0.65] px-3 py-2 text-sm text-ink-soft transition hover:border-accent/30 hover:text-ink-strong xl:min-w-[13rem]"
  >
    <Search class="size-4 shrink-0" />
    <span class="hidden min-w-0 flex-1 truncate whitespace-nowrap text-[13px] text-ink-faint transition group-hover:text-ink-soft sm:inline">
      {{ appConfig.commandBar.label }}
    </span>
    <span class="inline whitespace-nowrap text-[13px] text-ink-faint transition group-hover:text-ink-soft sm:hidden">搜索</span>
    <span
      class="hidden items-center gap-1 whitespace-nowrap rounded-[5px] border border-line/[0.15] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] 2xl:inline-flex"
    >
      <Command class="size-3" />
      {{ appConfig.commandBar.shortcut }}
    </span>
  </NuxtLink>
</template>
