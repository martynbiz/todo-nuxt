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
        'app-bg':     'var(--bg)',
        'app-header': 'var(--header-bg)',
        'app-board':  'var(--board-bg)',
        'app-card':   'var(--card-bg)',
        'app-border': 'var(--border)',
        'app-hover':  'var(--hover-bg)',
        'app-input':  'var(--input-bg)',
        'app-text':   'var(--text)',
        'app-muted':  'var(--text-muted)',
        'app-accent': 'var(--accent)',
      },
    },
  },
  plugins: [],
} satisfies Config
