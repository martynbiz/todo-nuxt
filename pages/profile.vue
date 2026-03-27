<template>
  <div class="min-h-screen flex flex-col bg-app-bg">
    <header class="flex items-center justify-between py-4 px-6 border-b border-app-border bg-app-header sticky top-0 z-10">
      <NuxtLink to="/" class="back-link flex items-center gap-1 text-[13px] text-app-muted no-underline transition-colors duration-150 hover:text-app-text">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Boards
      </NuxtLink>
      <h1 class="text-base font-bold text-app-text">Profile</h1>
      <UserMenu />
    </header>

    <main class="flex flex-col items-center gap-5 py-8 px-6">

      <!-- Personal info -->
      <section class="bg-app-card border border-app-border rounded-2xl p-7 w-full max-w-[480px]">
        <h2 class="text-[15px] font-bold text-app-text mb-5">Personal info</h2>
        <form @submit.prevent="saveProfile">
          <div class="flex flex-col gap-[6px] mb-4">
            <label class="text-xs font-semibold text-app-muted">Name</label>
            <input v-model="name" type="text" placeholder="Your name"
              class="bg-app-input border border-app-border rounded-lg py-[10px] px-3 text-sm text-app-text outline-none transition-colors duration-150 focus:border-app-accent" />
          </div>
          <div class="flex flex-col gap-[6px] mb-4">
            <label class="text-xs font-semibold text-app-muted">Email</label>
            <input :value="auth.user?.email" type="email" disabled
              class="bg-app-input border border-app-border rounded-lg py-[10px] px-3 text-sm text-app-muted outline-none opacity-60 cursor-not-allowed" />
            <p class="text-[11px] text-app-muted">Managed by your Microsoft account</p>
          </div>
          <div class="flex items-center justify-end gap-3 mt-1 flex-wrap">
            <p v-if="profileError" class="text-[13px] text-red-500 flex-1">{{ profileError }}</p>
            <p v-if="profileSuccess" class="text-[13px] text-emerald-500 flex-1">{{ profileSuccess }}</p>
            <button type="submit" class="btn-primary bg-app-accent text-white border-none rounded-lg py-[9px] px-5 text-[13px] font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" :disabled="profileLoading">
              {{ profileLoading ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </form>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()

const name = ref(auth.user?.name ?? '')
const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref('')

async function saveProfile() {
  profileError.value = ''
  profileSuccess.value = ''
  profileLoading.value = true
  try {
    await auth.updateProfile({ name: name.value })
    profileSuccess.value = 'Changes saved.'
  } catch (e: any) {
    profileError.value = e?.data?.message ?? 'Something went wrong'
  } finally {
    profileLoading.value = false
  }
}
</script>

<style scoped>
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
</style>
