import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as { id: string; name: string; email: string; theme: string } | null,
  }),

  actions: {
    async fetchMe() {
      try {
        this.user = await $fetch('/api/auth/me')
      } catch {
        this.user = null
      }
    },

    async updateSettings(data: { theme?: string }) {
      if (this.user && data.theme !== undefined) this.user.theme = data.theme
      await $fetch('/api/user/settings', { method: 'PATCH', body: data })
    },

    async updateProfile(data: { name?: string }) {
      const updated = await $fetch<{ id: string; name: string; email: string }>('/api/user/profile', {
        method: 'PATCH',
        body: data,
      })
      if (this.user) this.user.name = updated.name
    },

    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.user = null
    },
  },
})
