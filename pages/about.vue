<script setup lang="ts">
import { ArrowUpRight, Mail } from 'lucide-vue-next'

const appConfig = useAppConfig()

const focusAreas = ['Nuxt / Vue', 'TypeScript', 'Node / API', 'AI 辅助开发', '性能优化']

const profileNotes = [
  {
    title: '写真实项目',
    detail: '记录开发中的取舍、问题定位、上线过程和复盘，不把文章写成空泛教程。'
  },
  {
    title: '保留细节',
    detail: '把错误信息、调试路径、性能数据和代码组织方式留下来，方便以后回看。'
  },
  {
    title: '长期更新',
    detail: '文章、专题和项目会随实践持续修订，站点本身也是一个长期维护的作品。'
  }
]

useSeoMeta({
  title: '关于',
  description: '关于这个 AI 技术博客的作者、内容方向和联系方式'
})
</script>

<template>
  <div class="blog-page">
    <main class="blog-shell about-shell">
      <section class="about-hero" aria-labelledby="about-title">
        <p class="blog-kicker">About</p>
        <h1 id="about-title">关于这个博客</h1>
        <p>
          这里是 {{ appConfig.site.author }} 维护的个人技术笔记，主要记录前后端工程、AI 工具实践、
          项目复盘和一些长期会用到的开发经验。
        </p>

        <div class="about-focus-list" aria-label="关注方向">
          <span v-for="area in focusAreas" :key="area">{{ area }}</span>
        </div>

        <div class="about-actions">
          <NuxtLink to="/articles">
            阅读文章
            <ArrowUpRight class="size-3.5" />
          </NuxtLink>
          <NuxtLink to="/projects">
            查看项目
            <ArrowUpRight class="size-3.5" />
          </NuxtLink>
          <a :href="`mailto:${appConfig.site.email}`">
            联系我
            <Mail class="size-3.5" />
          </a>
        </div>
      </section>

      <section class="about-note-grid" aria-label="写作原则">
        <article v-for="note in profileNotes" :key="note.title">
          <h2>{{ note.title }}</h2>
          <p>{{ note.detail }}</p>
        </article>
      </section>
    </main>
  </div>
</template>
