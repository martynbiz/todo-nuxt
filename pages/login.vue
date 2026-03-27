<template>
  <div class="min-h-screen flex items-center justify-center bg-app-bg px-6 py-6">
    <div class="bg-app-board border border-app-border rounded-2xl p-9 w-full max-w-sm shadow-[0_16px_48px_rgba(0,0,0,0.3)]">
      <h1 class="text-xl font-extrabold text-app-text text-center mb-7 tracking-tight">Kanban Board</h1>

      <div class="flex bg-app-bg rounded-lg p-[3px] mb-6 gap-[2px]">
        <button
          :class="[
            'flex-1 border-none rounded text-[13px] cursor-pointer transition-colors duration-150 py-[7px]',
            mode === 'login' ? 'bg-app-card text-app-text font-semibold' : 'bg-transparent text-app-muted font-medium'
          ]"
          @click="mode = 'login'"
        >Log in</button>
        <button
          :class="[
            'flex-1 border-none rounded text-[13px] cursor-pointer transition-colors duration-150 py-[7px]',
            mode === 'register' ? 'bg-app-card text-app-text font-semibold' : 'bg-transparent text-app-muted font-medium'
          ]"
          @click="mode = 'register'"
        >Create account</button>
      </div>

      <form @submit.prevent="submit">
        <div v-if="mode === 'register'" class="flex flex-col gap-[6px] mb-4">
          <label class="text-xs font-semibold text-app-muted">Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="Your name"
            autocomplete="name"
            required
            class="bg-app-input border border-app-border rounded-lg py-[10px] px-3 text-sm text-app-text outline-none transition-colors duration-150 focus:border-app-accent"
          />
        </div>

        <div class="flex flex-col gap-[6px] mb-4">
          <label class="text-xs font-semibold text-app-muted">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
            class="bg-app-input border border-app-border rounded-lg py-[10px] px-3 text-sm text-app-text outline-none transition-colors duration-150 focus:border-app-accent"
          />
        </div>

        <div class="flex flex-col gap-[6px] mb-4">
          <label class="text-xs font-semibold text-app-muted">Password</label>
          <input
            v-model="password"
            type="password"
            :placeholder="mode === 'register' ? 'At least 8 characters' : 'Your password'"
            autocomplete="current-password"
            required
            class="bg-app-input border border-app-border rounded-lg py-[10px] px-3 text-sm text-app-text outline-none transition-colors duration-150 focus:border-app-accent"
          />
        </div>

        <div v-if="mode === 'register'" class="flex flex-col gap-[6px] mb-4">
          <label class="text-xs font-semibold text-app-muted">Confirm Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            autocomplete="new-password"
            required
            class="bg-app-input border border-app-border rounded-lg py-[10px] px-3 text-sm text-app-text outline-none transition-colors duration-150 focus:border-app-accent"
          />
        </div>

        <p v-if="error" class="text-[13px] text-red-500 mb-3">{{ error }}</p>

        <button
          type="submit"
          class="btn-submit w-full bg-app-accent text-white border-none rounded-lg py-[11px] text-sm font-semibold cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          {{ loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useKanbanStore } from '~/stores/kanban'

const auth = useAuthStore()
const kanban = useKanbanStore()

const mode = ref<'login' | 'register'>('login')
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

watch(mode, () => {
  error.value = ''
  confirmPassword.value = ''
})

async function submit() {
  error.value = ''
  if (mode.value === 'register') {
    if (!name.value.trim()) {
      error.value = 'Please enter your name'
      return
    }
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match'
      return
    }
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(email.value, password.value)
    } else {
      await auth.register(name.value.trim(), email.value, password.value)
    }
    await kanban.init()
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.btn-submit:hover:not(:disabled) { filter: brightness(1.1); }
</style>
