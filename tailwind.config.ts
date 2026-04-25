import type { Config } from 'tailwindcss'

export default {
  content: [
    './app.vue',
    './app.config.ts',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './server/**/*.{js,ts}',
    './nuxt.config.ts'
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
          strong: 'rgb(var(--color-surface-strong) / <alpha-value>)'
        },
        line: 'rgb(var(--color-line) / <alpha-value>)',
        ink: {
          strong: 'rgb(var(--color-ink-strong) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          warm: 'rgb(var(--color-accent-warm) / <alpha-value>)'
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"PingFang SC"', '"Noto Sans SC"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', '"SFMono-Regular"', 'monospace']
      },
      boxShadow: {
        soft: '0 18px 60px -24px rgba(15, 23, 32, 0.38)',
        panel: '0 18px 40px -28px rgba(10, 15, 20, 0.45)'
      },
      borderRadius: {
        shell: '1.5rem'
      },
      backgroundImage: {
        'editorial-grid':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)'
      }
    }
  }
} satisfies Config
