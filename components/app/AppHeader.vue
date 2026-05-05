<script setup lang="ts">
import { ArrowRight, Menu, Sparkles, X } from 'lucide-vue-next'
import { publicNavigation } from '~/data/navigation'

const appConfig = useAppConfig()
const route = useRoute()
const isMenuOpen = ref(false)

const isActiveLink = (to: string) => {
  return route.path === to || (to !== '/' && route.path.startsWith(`${to}/`))
}

watch(
  () => route.path,
  () => {
    isMenuOpen.value = false
  }
)
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-line/[0.12] bg-canvas/90 backdrop-blur-xl dark:bg-canvas/[0.82]"
  >
    <div class="mx-auto w-full max-w-[1080px] px-4 sm:px-6">
      <div class="flex h-[58px] items-center gap-3 xl:gap-3.5">
        <NuxtLink to="/" class="flex shrink-0 items-baseline gap-2.5">
          <span
            class="inline-flex size-8 items-center justify-center rounded-[7px] border border-accent/25 bg-accent/10 font-mono text-[10px] uppercase tracking-[0.18em] text-accent"
          >
            {{ appConfig.site.mark }}
          </span>
          <div class="hidden min-[480px]:block">
            <p class="single-line text-[14px] font-semibold leading-5 text-ink-strong">
              {{ appConfig.site.name }}
            </p>
            <p class="single-line text-[11px] leading-4 text-ink-faint">
              AI 技术、工具与长期笔记
            </p>
          </div>
        </NuxtLink>

        <nav class="hidden min-w-0 flex-1 items-center justify-center gap-4 xl:flex">
          <NuxtLink
            v-for="item in publicNavigation"
            :key="item.to"
            :to="item.to"
            class="single-line border-b border-transparent py-1 text-[13px] transition"
            :aria-current="isActiveLink(item.to) ? 'page' : undefined"
            :class="
              isActiveLink(item.to)
                ? 'border-accent/55 text-accent'
                : 'text-ink-soft hover:border-line/30 hover:text-ink-strong'
            "
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="hidden shrink-0 items-center gap-2 md:flex">
          <AppCommandLink />
          <AppThemeToggle />
          <NuxtLink
            to="/admin"
            class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[7px] bg-ink-strong px-3.5 py-2 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
          >
            <Sparkles class="size-4" />
            进入后台
            <ArrowRight class="size-4" />
          </NuxtLink>
        </div>

        <button
          type="button"
          class="ml-auto inline-flex size-10 items-center justify-center rounded-[7px] border border-line/[0.15] bg-surface/70 text-ink-strong xl:hidden"
          :aria-expanded="isMenuOpen"
          aria-label="切换导航菜单"
          @click="isMenuOpen = !isMenuOpen"
        >
          <component :is="isMenuOpen ? X : Menu" class="size-5" />
        </button>
      </div>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div v-if="isMenuOpen" class="border-t border-line/[0.1] py-4 xl:hidden">
          <div class="space-y-5">
            <div class="grid gap-2">
              <NuxtLink
                v-for="item in publicNavigation"
                :key="item.to"
                :to="item.to"
                class="flex items-center justify-between rounded-[7px] px-3 py-2.5 text-sm text-ink-soft transition hover:bg-surface-muted/70 hover:text-ink-strong"
                :aria-current="isActiveLink(item.to) ? 'page' : undefined"
                :class="
                  isActiveLink(item.to)
                    ? 'bg-accent/10 text-accent dark:bg-surface-strong/70 dark:text-ink-strong'
                    : ''
                "
              >
                <span class="single-line">{{ item.label }}</span>
                <span class="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                  {{ item.hint }}
                </span>
              </NuxtLink>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
              <AppCommandLink />
              <AppThemeToggle />
              <NuxtLink
                to="/admin"
                class="inline-flex items-center justify-center whitespace-nowrap rounded-[7px] bg-ink-strong px-4 py-2.5 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
              >
                进入后台
              </NuxtLink>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </header>
</template>
