import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const store = useAuthStore()
  try {
    // Forward the browser's session cookie when rendering on the server
    const headers = { ...useRequestHeaders(['cookie']) }
    store.user = await $fetch('/api/auth/me', { headers })
  } catch {
    store.user = null
  }
})
