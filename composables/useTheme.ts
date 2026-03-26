import { useAuthStore } from '~/stores/auth'

export type Theme = 'dark' | 'light'

export const useTheme = () => {
  const auth = useAuthStore()

  const theme = computed<Theme>(() => (auth.user?.theme as Theme) ?? 'dark')

  async function apply(t: Theme) {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', t)
    }
    await auth.updateSettings({ theme: t })
  }

  function init() {
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', auth.user?.theme || 'dark')
    }
  }

  return { theme, apply, init }
}
