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
      fontFamily: {
        mono: ['"Space Mono"', '"Courier New"', 'monospace'],
        sans: ['"Space Mono"', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        none: '0px', sm: '0px', DEFAULT: '0px', md: '0px', lg: '0px', xl: '0px', '2xl': '0px', '3xl': '0px', full: '0px',
      },
      borderWidth: {
        DEFAULT: '2px',
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0 0 var(--border)',
        brutal: '4px 4px 0 0 var(--border)',
        'brutal-lg': '8px 8px 0 0 var(--border)',
      },
    },
  },
  plugins: [],
} satisfies Config
