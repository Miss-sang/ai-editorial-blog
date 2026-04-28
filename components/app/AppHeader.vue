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
  <header class="sticky top-0 z-40 border-b border-line/10 bg-canvas/75 backdrop-blur-xl">
    <div class="mx-auto w-full max-w-[1400px] px-4 md:px-6 xl:px-8">
      <div class="flex h-[68px] items-center gap-3 xl:gap-3.5">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-3">
          <span
            class="inline-flex size-11 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 font-mono text-xs uppercase tracking-[0.24em] text-accent"
          >
            {{ appConfig.site.mark }}
          </span>
          <div class="hidden min-[480px]:block">
            <p class="single-line text-sm font-semibold text-ink-strong">{{ appConfig.site.name }}</p>
            <p class="single-line font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              个人中文技术博客
            </p>
          </div>
        </NuxtLink>

        <nav class="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
          <NuxtLink
            v-for="item in publicNavigation"
            :key="item.to"
            :to="item.to"
            class="single-line rounded-full px-3 py-2 text-[13px] transition"
            :aria-current="isActiveLink(item.to) ? 'page' : undefined"
            :class="
              isActiveLink(item.to)
                ? 'bg-surface-strong/70 text-ink-strong'
                : 'text-ink-soft hover:bg-surface/70 hover:text-ink-strong'
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
            class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-ink-strong px-4 py-2 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
          >
            <Sparkles class="size-4" />
            进入后台
            <ArrowRight class="size-4" />
          </NuxtLink>
        </div>

        <button
          type="button"
          class="ml-auto inline-flex size-11 items-center justify-center rounded-2xl border border-line/[0.15] bg-surface/70 text-ink-strong xl:hidden"
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
        <div v-if="isMenuOpen" class="pb-5 xl:hidden">
          <AppSurface class="space-y-5">
            <div class="grid gap-2">
              <NuxtLink
              v-for="item in publicNavigation"
              :key="item.to"
              :to="item.to"
              class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-ink-soft transition hover:bg-surface-muted/70 hover:text-ink-strong"
              :aria-current="isActiveLink(item.to) ? 'page' : undefined"
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
                class="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-ink-strong px-4 py-2.5 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
              >
                进入后台
              </NuxtLink>
            </div>
          </AppSurface>
        </div>
      </transition>
    </div>
  </header>
</template>
