<template>
  <div class="relative" ref="menuRef">
    <button class="w-[34px] h-[34px] rounded-full border-none p-0 cursor-pointer flex items-center justify-center bg-app-card transition-opacity duration-150 hover:opacity-85" @click="open = !open" :title="auth.user?.email">
      <span v-if="auth.user" class="w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm font-bold text-white" :style="{ background: avatarColor }">
        {{ initial }}
      </span>
      <svg v-else class="w-[18px] h-[18px] text-app-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="absolute right-0 top-[calc(100%+8px)] bg-app-card border border-app-border rounded-xl shadow-2xl min-w-[200px] p-[6px] z-[100]">
        <template v-if="auth.user">
          <div class="px-3 pt-[10px] pb-2">
            <div class="text-[13px] font-semibold text-app-text whitespace-nowrap overflow-hidden text-ellipsis">{{ auth.user.name || '—' }}</div>
            <div class="text-[11px] text-app-muted mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis">{{ auth.user.email }}</div>
          </div>
          <div class="h-px bg-app-border my-1" />
          <button class="dropdown-item flex items-center gap-[10px] w-full bg-transparent border-none rounded-lg py-2 px-3 text-[13px] text-app-text cursor-pointer text-left transition-colors duration-100 hover:bg-app-board" @click="go('/profile')">
            <svg class="w-[15px] h-[15px] shrink-0 text-app-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            Profile
          </button>
          <button class="dropdown-item flex items-center gap-[10px] w-full bg-transparent border-none rounded-lg py-2 px-3 text-[13px] text-app-text cursor-pointer text-left transition-colors duration-100 hover:bg-app-board" @click="go('/settings')">
            <svg class="w-[15px] h-[15px] shrink-0 text-app-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </button>
          <div class="h-px bg-app-border my-1" />
          <button class="flex items-center gap-[10px] w-full bg-transparent border-none rounded-lg py-2 px-3 text-[13px] text-red-500 cursor-pointer text-left transition-colors duration-100 hover:bg-red-500/[0.08]" @click="logout">
            <svg class="w-[15px] h-[15px] shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log out
          </button>
        </template>
        <template v-else>
          <button class="dropdown-item flex items-center gap-[10px] w-full bg-transparent border-none rounded-lg py-2 px-3 text-[13px] text-app-text cursor-pointer text-left transition-colors duration-100 hover:bg-app-board" @click="go('/login')">
            <svg class="w-[15px] h-[15px] shrink-0 text-app-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Log in
          </button>
          <button class="dropdown-item flex items-center gap-[10px] w-full bg-transparent border-none rounded-lg py-2 px-3 text-[13px] text-app-text cursor-pointer text-left transition-colors duration-100 hover:bg-app-board" @click="go('/login')">
            <svg class="w-[15px] h-[15px] shrink-0 text-app-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Create account
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useKanbanStore } from '~/stores/kanban'

const auth = useAuthStore()
const kanban = useKanbanStore()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

const initial = computed(() => {
  const str = auth.user?.name || auth.user?.email || '?'
  return str[0].toUpperCase()
})

const avatarColor = computed(() => {
  const str = auth.user?.name || auth.user?.email || ''
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
})

function onClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

watch(open, (val) => {
  if (val) document.addEventListener('mousedown', onClickOutside)
  else document.removeEventListener('mousedown', onClickOutside)
})

onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

function go(path: string) {
  open.value = false
  navigateTo(path)
}

async function logout() {
  open.value = false
  await auth.logout()
  kanban.$reset()
  await navigateTo('/login')
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.12s, transform 0.12s;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
