import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.ts',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        'app-bg':          'var(--bg)',
        'app-header':      'var(--header-bg)',
        'app-board':       'var(--board-bg)',
        'app-card':        'var(--card-bg)',
        'app-border':      'var(--border)',
        'app-hover':       'var(--hover-bg)',
        'app-input':       'var(--input-bg)',
        'app-text':        'var(--text)',
        'app-muted':       'var(--text-muted)',
        'app-accent':      'rgb(var(--accent-rgb) / <alpha-value>)',
        'app-accent-fg':   'var(--accent-fg)',
        'app-accent-soft': 'var(--accent-soft)',
        'app-danger':      'rgb(var(--danger-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 12px rgb(0 0 0 / 0.10), 0 1px 3px rgb(0 0 0 / 0.06)',
        overlay: '0 20px 40px -8px rgb(0 0 0 / 0.25), 0 4px 12px rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
