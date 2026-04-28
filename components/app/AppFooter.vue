<script setup lang="ts">
import { publicNavigation } from '~/data/navigation'

const appConfig = useAppConfig()
</script>

<template>
  <footer class="border-t border-line/10">
    <div class="app-container py-10 md:py-14">
      <div class="grid gap-8 lg:grid-cols-[1.3fr_0.9fr_0.8fr]">
        <div class="space-y-4">
          <p class="eyebrow">{{ appConfig.site.name }}</p>
          <h2 class="max-w-md panel-title">
            {{ appConfig.site.headline }}
          </h2>
          <p class="max-w-xl body-copy">
            {{ appConfig.site.description }}
          </p>
        </div>

        <div class="space-y-4">
          <p class="eyebrow">站点导航</p>
          <div class="grid gap-3">
            <NuxtLink
              v-for="item in publicNavigation"
              :key="item.to"
              :to="item.to"
              class="text-sm text-ink-soft transition hover:text-ink-strong"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
        </div>

        <div class="space-y-4">
          <p class="eyebrow">技术栈</p>
          <div class="flex flex-wrap gap-2">
            <AppStatusPill>Nuxt 3</AppStatusPill>
            <AppStatusPill>Tailwind</AppStatusPill>
            <AppStatusPill>Prisma</AppStatusPill>
            <AppStatusPill>Supabase</AppStatusPill>
            <AppStatusPill tone="accent">AI 阅读</AppStatusPill>
          </div>
          <p class="text-sm leading-6 text-ink-faint">
            个人中文技术博客，记录前端、后端与项目复盘。
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>
