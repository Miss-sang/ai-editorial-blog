<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { ArticleRecord, ProjectRecord } from '~/types/content-studio'
import { getProjectStatusLabel } from '~/utils/display'

defineProps<{
  projects: ProjectRecord[]
  aiArticles: ArticleRecord[]
}>()
</script>

<template>
  <section class="blog-notes-grid" aria-label="项目和实验碎片">
    <div class="blog-notes-column">
      <HomeSectionTitle
        title="项目"
        eyebrow="Projects"
      />

      <div v-if="projects.length" class="blog-note-list">
        <NuxtLink
          v-for="project in projects"
          :key="project.id"
          to="/projects"
          class="blog-note-row"
        >
          <span class="blog-note-row-content">
            <strong>{{ project.title }}</strong>
            <small>{{ project.summary }}</small>
          </span>
          <em>{{ getProjectStatusLabel(project.status) }}</em>
        </NuxtLink>
      </div>
      <AppEmptyState
        v-else
        title="暂无项目"
      />
    </div>

    <div class="blog-notes-column">
      <HomeSectionTitle
        title="模型观察"
        eyebrow="AI Notes"
      />

      <div v-if="aiArticles.length" class="blog-note-list">
        <NuxtLink
          v-for="article in aiArticles"
          :key="article.id"
          :to="`/articles/${article.slug}`"
          class="blog-note-row"
        >
          <span class="blog-note-row-content">
            <strong>{{ article.title }}</strong>
            <small>{{ article.summary || article.excerpt }}</small>
          </span>
          <ArrowUpRight class="size-4" />
        </NuxtLink>
      </div>
      <div v-else class="blog-note-list">
        <NuxtLink to="/labs" class="blog-note-row">
          <span class="blog-note-row-content">
            <strong>Prompt Lab</strong>
          </span>
          <ArrowUpRight class="size-4" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
