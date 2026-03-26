<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Kanban Board</h1>

      <div class="auth-tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Log in</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">Create account</button>
      </div>

      <form @submit.prevent="submit">
        <div v-if="mode === 'register'" class="field">
          <label>Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="Your name"
            autocomplete="name"
            required
          />
        </div>

        <div class="field">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            :placeholder="mode === 'register' ? 'At least 8 characters' : 'Your password'"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="mode === 'register'" class="field">
          <label>Confirm Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            autocomplete="new-password"
            required
          />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="btn-submit" :disabled="loading">
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
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

.auth-card {
  background: var(--board-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 36px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.3);
}

.auth-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
  text-align: center;
  margin-bottom: 28px;
  letter-spacing: -0.5px;
}

.auth-tabs {
  display: flex;
  background: var(--bg);
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 24px;
  gap: 2px;
}
.auth-tabs button {
  flex: 1;
  background: none;
  border: none;
  border-radius: 6px;
  padding: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.auth-tabs button.active {
  background: var(--card-bg);
  color: var(--text);
  font-weight: 600;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}
.field input {
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
}
.field input:focus { border-color: var(--accent); }

.error {
  font-size: 13px;
  color: #ef4444;
  margin-bottom: 12px;
}

.btn-submit {
  width: 100%;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 11px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s;
  margin-top: 4px;
}
.btn-submit:hover:not(:disabled) { filter: brightness(1.1); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
