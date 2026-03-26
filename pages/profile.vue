<template>
  <div class="subpage">
    <header class="subpage-header">
      <NuxtLink to="/" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Boards
      </NuxtLink>
      <h1 class="subpage-title">Profile</h1>
      <UserMenu />
    </header>

    <main class="subpage-content">

      <!-- Personal info -->
      <section class="card">
        <h2 class="card-title">Personal info</h2>
        <form @submit.prevent="saveProfile">
          <div class="field">
            <label>Name</label>
            <input v-model="name" type="text" placeholder="Your name" />
          </div>
          <div class="field">
            <label>Email</label>
            <input v-model="email" type="email" placeholder="you@example.com" />
          </div>
          <div class="form-footer">
            <p v-if="profileError" class="msg msg--error">{{ profileError }}</p>
            <p v-if="profileSuccess" class="msg msg--success">{{ profileSuccess }}</p>
            <button type="submit" class="btn-primary" :disabled="profileLoading">
              {{ profileLoading ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Change password -->
      <section class="card">
        <h2 class="card-title">Change password</h2>
        <form @submit.prevent="savePassword">
          <div class="field">
            <label>Current password</label>
            <input v-model="currentPassword" type="password" placeholder="Your current password" />
          </div>
          <div class="field">
            <label>New password</label>
            <input v-model="newPassword" type="password" placeholder="At least 8 characters" />
          </div>
          <div class="field">
            <label>Confirm new password</label>
            <input v-model="confirmPassword" type="password" placeholder="Repeat new password" />
          </div>
          <div class="form-footer">
            <p v-if="passwordError" class="msg msg--error">{{ passwordError }}</p>
            <p v-if="passwordSuccess" class="msg msg--success">{{ passwordSuccess }}</p>
            <button type="submit" class="btn-primary" :disabled="passwordLoading">
              {{ passwordLoading ? 'Updating…' : 'Update password' }}
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

// Personal info
const name = ref(auth.user?.name ?? '')
const email = ref(auth.user?.email ?? '')
const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref('')

async function saveProfile() {
  profileError.value = ''
  profileSuccess.value = ''
  profileLoading.value = true
  try {
    await auth.updateProfile({ name: name.value, email: email.value })
    profileSuccess.value = 'Changes saved.'
  } catch (e: any) {
    profileError.value = e?.data?.message ?? 'Something went wrong'
  } finally {
    profileLoading.value = false
  }
}

// Change password
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

async function savePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'New passwords do not match'
    return
  }
  passwordLoading.value = true
  try {
    await $fetch('/api/user/password', {
      method: 'PATCH',
      body: { currentPassword: currentPassword.value, newPassword: newPassword.value },
    })
    passwordSuccess.value = 'Password updated.'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: any) {
    passwordError.value = e?.data?.message ?? 'Something went wrong'
  } finally {
    passwordLoading.value = false
  }
}
</script>

<style scoped>
.subpage {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.subpage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--header-bg);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.back-link:hover { color: var(--text); }
.back-link svg { width: 16px; height: 16px; }

.subpage-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.subpage-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px 24px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 480px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 20px;
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

.form-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.msg {
  font-size: 13px;
  flex: 1;
}
.msg--error { color: #ef4444; }
.msg--success { color: #10b981; }

.btn-primary {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
