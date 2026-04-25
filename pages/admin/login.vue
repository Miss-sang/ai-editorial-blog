<script setup lang="ts">
import { ArrowLeft, LockKeyhole, ShieldAlert } from 'lucide-vue-next'
import { useAdminSession } from '~/composables/useAdminSession'

definePageMeta({
  layout: false
})

useSeoMeta({
  title: '后台登录',
  description: '仅限站点维护者进入后台内容管理台'
})

const route = useRoute()
const { login, session } = useAdminSession()

const form = reactive({
  email: '',
  password: ''
})

const pending = ref(false)
const errorMessage = ref('')
const blockedModal = reactive({
  visible: false,
  title: '功能暂未开放',
  message: '暂时无法注册，仅支持博主本人登录后台'
})

if (session.value.authenticated) {
  await navigateTo((route.query.redirect as string) || '/admin')
}

const getErrorPayload = (error: unknown) => {
  const normalized = error as {
    statusCode?: number
    statusMessage?: string
    data?: {
      code?: string
      message?: string
      statusMessage?: string
    }
    message?: string
  }

  return {
    statusCode: normalized.statusCode,
    code: normalized.data?.code || '',
    message:
      normalized.data?.message ||
      normalized.data?.statusMessage ||
      normalized.statusMessage ||
      normalized.message ||
      '登录失败，请稍后重试'
  }
}

const handleLogin = async () => {
  pending.value = true
  errorMessage.value = ''

  try {
    await login(form)
    await navigateTo((route.query.redirect as string) || '/admin')
  } catch (error) {
    const loginError = getErrorPayload(error)

    if (loginError.statusCode === 403 || loginError.code === 'OWNER_ONLY_ACCESS') {
      blockedModal.visible = true
      blockedModal.message = loginError.message
      errorMessage.value = ''
    } else {
      errorMessage.value = loginError.message
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="blockedModal.visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm"
      >
        <AppSurface class="w-full max-w-md space-y-4">
          <div class="flex items-start gap-3">
            <div class="inline-flex size-11 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <ShieldAlert class="size-5" />
            </div>
            <div class="space-y-2">
              <p class="eyebrow">访问受限</p>
              <h2 class="panel-title">{{ blockedModal.title }}</h2>
              <p class="body-copy">{{ blockedModal.message }}</p>
            </div>
          </div>
          <div class="flex justify-end">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-ink-strong px-5 py-2.5 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d]"
              @click="blockedModal.visible = false"
            >
              我知道了
            </button>
          </div>
        </AppSurface>
      </div>
    </transition>

    <div class="app-container flex min-h-screen items-center justify-center py-10">
      <div class="grid w-full max-w-5xl gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <AppSurface class="space-y-5">
          <AppStatusPill tone="accent">仅限本人登录</AppStatusPill>
          <div class="space-y-3">
            <p class="eyebrow">后台访问说明</p>
            <h1 class="max-w-2xl text-[1.95rem] font-semibold leading-[1.05] tracking-tight md:text-[2.75rem]">
              后台用于统一管理文章、专题、项目与发布状态
            </h1>
            <p class="max-w-2xl body-copy">
              仅支持站点维护者本人登录，不开放注册，非授权访问会直接提示功能暂未开放
            </p>
          </div>
          <div class="grid gap-3">
            <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">登录规则</p>
              <p class="mt-2 body-copy">
                仅识别预设管理员账号，非本人登录会直接弹出受限提示
              </p>
            </div>
            <div class="rounded-3xl border border-line/10 bg-surface-muted/50 p-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">部署提醒</p>
              <p class="mt-2 body-copy">
                部署前请配置后台账号、会话密钥和数据库连接，不要保留默认示例值
              </p>
            </div>
          </div>
        </AppSurface>

        <AppSurface class="space-y-4">
          <div class="space-y-2">
            <p class="eyebrow">后台登录</p>
            <h2 class="panel-title">后台管理入口</h2>
          </div>

          <form class="space-y-4" :aria-busy="pending ? 'true' : 'false'" @submit.prevent="handleLogin">
            <label class="grid gap-2">
              <span class="text-sm font-medium text-ink-strong">账号邮箱</span>
              <input
                id="admin-login-email"
                v-model="form.email"
                type="email"
                autocomplete="username"
                class="w-full rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition placeholder:text-ink-faint focus:border-accent/40"
                placeholder="请输入维护者邮箱"
                :aria-invalid="errorMessage ? 'true' : 'false'"
                :aria-describedby="errorMessage ? 'admin-login-error' : undefined"
              >
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-medium text-ink-strong">登录密码</span>
              <input
                id="admin-login-password"
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                class="w-full rounded-[1.4rem] border border-line/[0.15] bg-surface-muted/60 px-4 py-3 text-sm text-ink-strong outline-none transition placeholder:text-ink-faint focus:border-accent/40"
                placeholder="请输入后台密码"
                :aria-invalid="errorMessage ? 'true' : 'false'"
                :aria-describedby="errorMessage ? 'admin-login-error' : undefined"
              >
            </label>

            <p
              v-if="errorMessage"
              id="admin-login-error"
              class="text-sm text-danger"
              role="alert"
              aria-live="assertive"
            >
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-strong px-5 py-3 text-sm text-canvas transition hover:bg-accent hover:text-[#08110d] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="pending"
            >
              <LockKeyhole class="size-4" />
              {{ pending ? '正在登录...' : '进入后台' }}
            </button>
          </form>

          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 text-sm text-ink-soft transition hover:text-accent"
          >
            <ArrowLeft class="size-4" />
            返回前台首页
          </NuxtLink>
        </AppSurface>
      </div>
    </div>
  </div>
</template>
