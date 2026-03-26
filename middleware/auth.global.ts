import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  if (!authStore.user && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (authStore.user && to.path === '/login') {
    return navigateTo('/')
  }
})
