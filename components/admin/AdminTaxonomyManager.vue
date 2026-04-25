<script setup lang="ts">
import { PencilLine, Plus, Save, Trash2, X } from 'lucide-vue-next'
import type {
  TagEditorPayload,
  TagRecord,
  TopicEditorPayload,
  TopicRecord
} from '~/types/content-studio'
import { formatDisplayDateTime } from '~/utils/display'

type TaxonomyItem = TopicRecord | TagRecord
type TaxonomyKind = 'topic' | 'tag'

const props = withDefaults(
  defineProps<{
    kind: TaxonomyKind
    items: TaxonomyItem[]
    creating?: boolean
    savingId?: string
    deletingId?: string
  }>(),
  {
    creating: false,
    savingId: '',
    deletingId: ''
  }
)

const emit = defineEmits<{
  create: [payload: TopicEditorPayload | TagEditorPayload]
  update: [id: string, payload: TopicEditorPayload | TagEditorPayload]
  delete: [id: string]
}>()

const createForm = reactive({
  name: '',
  description: '',
  color: '#0ea5e9'
})

const editingId = ref('')
const editForm = reactive({
  name: '',
  description: '',
  color: '#0ea5e9'
})

const fieldClass =
  'w-full rounded-[1.2rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition placeholder:text-ink-faint focus:border-accent/40'

const copy = computed(() => {
  if (props.kind === 'topic') {
    return {
      singular: '专题',
      plural: '专题',
      title: '主知识结构',
      description:
        '专题用于承接稳定的知识主线，适合管理 Vue 3、浏览器原理、计算机网络等长期内容'
    }
  }

  return {
    singular: '标签',
    plural: '标签',
    title: '检索标签',
    description:
      '标签用于补充细粒度技术点，服务搜索、筛选和后续 AI 推荐'
  }
})

const isTagItem = (item: TaxonomyItem): item is TagRecord => 'color' in item
const getTagColor = (item: TaxonomyItem) => (isTagItem(item) ? item.color || '' : '')

const beginEdit = (item: TaxonomyItem) => {
  editingId.value = item.id
  editForm.name = item.name
  editForm.description = 'description' in item ? item.description || '' : ''
  editForm.color = isTagItem(item) ? item.color || '#0ea5e9' : '#0ea5e9'
}

const resetEdit = () => {
  editingId.value = ''
  editForm.name = ''
  editForm.description = ''
  editForm.color = '#0ea5e9'
}

const resetCreate = () => {
  createForm.name = ''
  createForm.description = ''
  createForm.color = '#0ea5e9'
}

const submitCreate = () => {
  if (props.kind === 'topic') {
    emit('create', {
      name: createForm.name,
      description: createForm.description
    })
  } else {
    emit('create', {
      name: createForm.name,
      color: createForm.color
    })
  }

  resetCreate()
}

const submitUpdate = (id: string) => {
  if (props.kind === 'topic') {
    emit('update', id, {
      name: editForm.name,
      description: editForm.description
    })
  } else {
    emit('update', id, {
      name: editForm.name,
      color: editForm.color
    })
  }

  resetEdit()
}
</script>

<template>
  <div class="space-y-6">
    <AppSurface class="space-y-5">
      <div class="space-y-2">
        <p class="eyebrow">{{ copy.plural }}</p>
        <h2 class="text-2xl font-semibold tracking-tight">{{ copy.title }}</h2>
        <p class="max-w-3xl text-sm leading-7 text-ink-soft">
          {{ copy.description }}
        </p>
      </div>

      <form class="grid gap-4 xl:grid-cols-[1fr_1fr_auto]" @submit.prevent="submitCreate">
        <label class="grid gap-2">
          <span class="sr-only">{{ props.kind === 'topic' ? '专题名称' : '标签名称' }}</span>
          <input
            v-model="createForm.name"
            type="text"
            :class="fieldClass"
            :placeholder="props.kind === 'topic' ? 'Vue 3 与 TypeScript' : '浏览器缓存'"
          >
        </label>
        <template v-if="props.kind === 'topic'">
          <label class="grid gap-2">
            <span class="sr-only">专题描述</span>
            <input
              v-model="createForm.description"
              type="text"
              :class="fieldClass"
              placeholder="用于描述该专题的内容范围"
            >
          </label>
        </template>
        <template v-else>
          <label class="flex items-center gap-3 rounded-[1.2rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3">
            <span class="sr-only">标签颜色</span>
            <input v-model="createForm.color" type="color" class="size-9 rounded-full border border-line/10 bg-transparent">
            <input
              v-model="createForm.color"
              type="text"
              class="min-w-0 flex-1 bg-transparent text-sm text-ink-strong outline-none"
              placeholder="#0ea5e9"
              aria-label="标签颜色值"
            >
          </label>
        </template>
        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
          :disabled="creating"
        >
          <Plus class="size-4" />
          {{ creating ? '提交中...' : `新增${copy.singular}` }}
        </button>
      </form>
    </AppSurface>

    <div v-if="items.length" class="grid gap-4">
      <AppSurface
        v-for="item in items"
        :key="item.id"
        class="space-y-4"
      >
        <div
          v-if="editingId !== item.id"
          class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"
        >
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <AppStatusPill>{{ item.slug }}</AppStatusPill>
              <AppStatusPill tone="accent">{{ item.articleCount }} 篇文章</AppStatusPill>
              <AppStatusPill v-if="getTagColor(item)">
                <span
                  class="size-2 rounded-full"
                  :style="{ backgroundColor: getTagColor(item) }"
                />
                {{ getTagColor(item) }}
              </AppStatusPill>
            </div>
            <div>
              <h3 class="text-xl font-semibold tracking-tight">{{ item.name }}</h3>
              <p v-if="'description' in item && item.description" class="mt-2 text-sm leading-7 text-ink-soft">
                {{ item.description }}
              </p>
            </div>
            <p class="text-xs uppercase tracking-[0.22em] text-ink-faint">
              最近更新 {{ formatDisplayDateTime(item.updatedAt) }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-line/[0.15] px-4 py-2 text-sm text-ink-strong transition hover:border-accent/30 hover:text-accent"
              @click="beginEdit(item)"
            >
              <PencilLine class="size-4" />
              编辑
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-danger/30 px-4 py-2 text-sm text-danger transition hover:bg-danger/10"
              :disabled="deletingId === item.id"
              @click="emit('delete', item.id)"
            >
              <Trash2 class="size-4" />
              {{ deletingId === item.id ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>

        <form
          v-else
          class="grid gap-4 xl:grid-cols-[1fr_1fr_auto_auto]"
          @submit.prevent="submitUpdate(item.id)"
        >
          <label class="grid gap-2">
            <span class="sr-only">{{ props.kind === 'topic' ? '专题名称' : '标签名称' }}</span>
            <input
              v-model="editForm.name"
              type="text"
              :class="fieldClass"
              :placeholder="props.kind === 'topic' ? 'Vue 3 与 TypeScript' : '浏览器缓存'"
            >
          </label>
          <template v-if="props.kind === 'topic'">
            <label class="grid gap-2">
              <span class="sr-only">专题描述</span>
              <input
                v-model="editForm.description"
                type="text"
                :class="fieldClass"
                placeholder="用于描述该专题的内容范围"
              >
            </label>
          </template>
          <template v-else>
            <label class="flex items-center gap-3 rounded-[1.2rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3">
              <span class="sr-only">标签颜色</span>
              <input v-model="editForm.color" type="color" class="size-9 rounded-full border border-line/10 bg-transparent">
              <input
                v-model="editForm.color"
                type="text"
                class="min-w-0 flex-1 bg-transparent text-sm text-ink-strong outline-none"
                placeholder="#0ea5e9"
                aria-label="标签颜色值"
              >
            </label>
          </template>
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-accent/30 px-4 py-3 text-sm text-accent transition hover:bg-accent/10"
            :disabled="savingId === item.id"
          >
            <Save class="size-4" />
            {{ savingId === item.id ? '保存中...' : '保存' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-line/[0.15] px-4 py-3 text-sm text-ink-soft transition hover:text-ink-strong"
            @click="resetEdit"
          >
            <X class="size-4" />
            取消
          </button>
        </form>
      </AppSurface>
    </div>

    <AppEmptyState
      v-else
      :title="`暂时还没有${copy.plural}`"
      :description="`先创建第一个${copy.singular}，再把文章组织到统一的知识结构里`"
    />
  </div>
</template>
