<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import { publicNavigation } from '~/data/navigation'

const appConfig = useAppConfig()
const primaryNavigation = publicNavigation.filter((item) =>
  ['文章', '专题', 'AI', '项目'].includes(item.label)
)
</script>

<template>
  <section class="blog-intro" aria-labelledby="home-title">
    <div class="blog-intro-main">
      <p class="blog-kicker">AI 技术、工具与长期笔记</p>
      <h1 id="home-title">{{ appConfig.site.name }}</h1>
      <nav class="blog-local-nav" aria-label="首页导航">
        <NuxtLink
          v-for="item in primaryNavigation"
          :key="item.to"
          :to="item.to"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>

    <aside class="blog-intro-note" aria-label="作者注记">
      <div class="blog-signature">{{ appConfig.site.mark.slice(0, 1) }}.</div>
      <NuxtLink to="/about" class="blog-note-link">
        About
        <ArrowUpRight class="size-3.5" />
      </NuxtLink>
    </aside>
  </section>
</template>
