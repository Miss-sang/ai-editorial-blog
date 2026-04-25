<script setup lang="ts">
import type { ArticleRecord, ArticleStatusAction } from '~/types/content-studio'
import { getArticleActionLabel } from '~/utils/display'

const props = withDefaults(
  defineProps<{
    article: ArticleRecord
    pendingAction?: ArticleStatusAction | ''
  }>(),
  {
    pendingAction: ''
  }
)

const emit = defineEmits<{
  action: [action: ArticleStatusAction]
}>()

const actions = computed(() => {
  const shared = {
    MOVE_TO_DRAFT: {
      action: 'MOVE_TO_DRAFT' as const,
      label: props.article.status === 'PUBLISHED' ? '撤回为草稿' : getArticleActionLabel('MOVE_TO_DRAFT'),
      toneClass: 'border-line/[0.15] text-ink-strong hover:border-accent/30 hover:text-accent'
    },
    MOVE_TO_REVIEW: {
      action: 'MOVE_TO_REVIEW' as const,
      label: getArticleActionLabel('MOVE_TO_REVIEW'),
      toneClass: 'border-warning/30 text-warning hover:bg-warning/10'
    },
    PUBLISH: {
      action: 'PUBLISH' as const,
      label: getArticleActionLabel('PUBLISH'),
      toneClass: 'border-success/30 text-success hover:bg-success/10'
    },
    ARCHIVE: {
      action: 'ARCHIVE' as const,
      label: getArticleActionLabel('ARCHIVE'),
      toneClass: 'border-line/[0.15] text-ink-soft hover:border-line/30 hover:text-ink-strong'
    }
  }

  switch (props.article.status) {
    case 'DRAFT':
      return [shared.MOVE_TO_REVIEW, shared.PUBLISH, shared.ARCHIVE]
    case 'REVIEW':
      return [shared.MOVE_TO_DRAFT, shared.PUBLISH, shared.ARCHIVE]
    case 'PUBLISHED':
      return [shared.MOVE_TO_DRAFT, shared.MOVE_TO_REVIEW, shared.ARCHIVE]
    case 'ARCHIVED':
      return [shared.MOVE_TO_DRAFT, shared.MOVE_TO_REVIEW, shared.PUBLISH]
  }

  return []
})
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="item in actions"
      :key="item.action"
      type="button"
      class="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm transition"
      :class="item.toneClass"
      :disabled="pendingAction === item.action"
      @click="emit('action', item.action)"
    >
      {{ pendingAction === item.action ? '处理中...' : item.label }}
    </button>
  </div>
</template>
