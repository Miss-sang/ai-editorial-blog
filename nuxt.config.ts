const publicSupabaseUrl =
  process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''

const publicSupabaseAnonKey =
  process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''

const databaseUrl = process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || ''
const publicSiteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const publicSiteName = process.env.NUXT_PUBLIC_SITE_NAME || '知栈技术博客'
const publicSiteDescription =
  process.env.NUXT_PUBLIC_SITE_DESCRIPTION ||
  '个人中文技术博客，记录前端、后端开发中的问题、实现与项目复盘。'

const supabaseServiceRoleKey =
  process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseStorageBucket =
  process.env.NUXT_SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'blog-assets'

const longcatApiKey = process.env.NUXT_LONGCAT_API_KEY || process.env.LONGCAT_API_KEY || ''
const longcatChatModel =
  process.env.NUXT_LONGCAT_CHAT_MODEL || process.env.LONGCAT_CHAT_MODEL || 'LongCat-Flash-Chat'
const longcatReasoningModel =
  process.env.NUXT_LONGCAT_REASONING_MODEL ||
  process.env.LONGCAT_REASONING_MODEL ||
  'LongCat-Flash-Thinking'

const adminSessionSecret =
  process.env.NUXT_ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || ''

const adminLoginEmail =
  process.env.NUXT_ADMIN_LOGIN_EMAIL || process.env.ADMIN_LOGIN_EMAIL || 'admin@axiom-notes.dev'

const adminLoginPassword =
  process.env.NUXT_ADMIN_LOGIN_PASSWORD || process.env.ADMIN_LOGIN_PASSWORD || 'change-me-please'

const adminDisplayName =
  process.env.NUXT_ADMIN_DISPLAY_NAME || process.env.ADMIN_DISPLAY_NAME || '站点维护者'

export default defineNuxtConfig({
  compatibilityDate: '2026-04-24',
  devtools: {
    enabled: true
  },
  experimental: {
    // Work around Nuxt dev-time resolution issues around `#app-manifest`.
    appManifest: false
  },
  css: ['~/assets/styles/main.css'],
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],
  app: {
    head: {
      titleTemplate: '%s · 知栈技术博客',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        },
        {
          name: 'theme-color',
          content: '#f4efe5'
        }
      ],
      link: [
        {
          rel: 'icon',
          href: '/favicon.ico'
        }
      ]
    }
  },
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark'
  },
  runtimeConfig: {
    databaseUrl,
    supabaseServiceRoleKey,
    supabaseStorageBucket,
    longcatApiKey,
    longcatBaseUrl:
      process.env.NUXT_LONGCAT_BASE_URL ||
      process.env.LONGCAT_BASE_URL ||
      'https://api.longcat.chat/openai',
    longcatChatModel,
    longcatReasoningModel,
    adminSessionSecret,
    adminLoginEmail,
    adminLoginPassword,
    adminDisplayName,
    public: {
      siteUrl: publicSiteUrl,
      siteName: publicSiteName,
      siteDescription: publicSiteDescription,
      supabaseUrl: publicSupabaseUrl,
      supabaseAnonKey: publicSupabaseAnonKey
    }
  },
  typescript: {
    strict: true,
    typeCheck: false
  },
  tailwindcss: {
    viewer: false
  }
})
