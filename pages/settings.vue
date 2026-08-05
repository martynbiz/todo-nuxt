<template>
  <div class="min-h-screen flex flex-col bg-app-bg">
    <header class="flex items-center justify-between py-4 px-6 border-b border-app-border bg-app-header sticky top-0 z-10">
      <NuxtLink to="/" class="back-link flex items-center gap-1 text-[13px] text-app-muted no-underline transition-colors duration-150 hover:text-app-text">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Boards
      </NuxtLink>
      <h1 class="text-base font-bold text-app-text">Settings</h1>
      <UserMenu />
    </header>

    <main class="flex flex-col items-center gap-5 py-8 px-6">

      <!-- Appearance -->
      <section class="bg-app-card border border-app-border rounded-2xl p-7 w-full max-w-[480px]">
        <h2 class="text-[15px] font-bold text-app-text mb-5">Appearance</h2>
        <div class="flex items-center justify-between gap-4">
          <div class="flex flex-col gap-[3px] text-sm font-medium text-app-text">
            <span>Theme</span>
            <span class="text-xs text-app-muted font-normal">Choose your preferred colour scheme</span>
          </div>
          <div class="flex bg-app-bg rounded-lg p-[3px] gap-[2px]">
            <button
              class="theme-btn flex items-center gap-[6px] border-none rounded text-[13px] cursor-pointer transition-colors duration-150 py-[7px] px-[14px]"
              :class="theme === 'dark' ? 'bg-app-card text-app-text font-semibold' : 'bg-transparent text-app-muted font-medium'"
              @click="apply('dark')"
            >
              <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              Dark
            </button>
            <button
              class="theme-btn flex items-center gap-[6px] border-none rounded text-[13px] cursor-pointer transition-colors duration-150 py-[7px] px-[14px]"
              :class="theme === 'light' ? 'bg-app-card text-app-text font-semibold' : 'bg-transparent text-app-muted font-medium'"
              @click="apply('light')"
            >
              <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              Light
            </button>
          </div>
        </div>
      </section>

      <!-- Data -->
      <section class="bg-app-card border border-app-border rounded-2xl p-7 w-full max-w-[480px]">
        <h2 class="text-[15px] font-bold text-app-text mb-5">Data</h2>

        <!-- Export -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex flex-col gap-[3px] text-sm font-medium text-app-text">
            <span>Export</span>
            <span class="text-xs text-app-muted font-normal">Download all boards, items and tags as JSON</span>
          </div>
          <button class="btn-secondary inline-flex items-center gap-[6px] bg-app-card border border-app-border shadow-brutal-sm rounded-lg py-[7px] px-[14px] text-[13px] font-medium text-app-text cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-app-hover focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2" :disabled="exporting" @click="exportData">
            <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {{ exporting ? 'Exporting…' : 'Export JSON' }}
          </button>
        </div>

        <div class="h-px bg-app-border my-5" />

        <!-- Import -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex flex-col gap-[3px] text-sm font-medium text-app-text">
            <span>Import</span>
            <span class="text-xs text-app-muted font-normal">Restore from a previously exported JSON file</span>
          </div>
          <label class="btn-file inline-flex items-center gap-[6px] bg-app-card border border-app-border shadow-brutal-sm rounded-lg py-[7px] px-[14px] text-[13px] font-medium text-app-text cursor-pointer whitespace-nowrap transition-colors duration-150 relative overflow-hidden hover:bg-app-hover">
            <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Choose file
            <input type="file" accept=".json,application/json" class="absolute inset-0 opacity-0 cursor-pointer text-[0px]" @change="onFileChange" />
          </label>
        </div>

        <div v-if="importFile" class="flex items-center gap-3 mt-4 flex-wrap">
          <span class="flex-1 text-[13px] text-app-muted overflow-hidden text-ellipsis whitespace-nowrap">{{ importFile.name }}</span>
          <button class="btn-primary bg-app-text text-app-bg border border-app-border shadow-brutal-sm rounded-lg py-2 px-[18px] text-[13px] font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2" :disabled="importing" @click="importData">
            {{ importing ? 'Importing…' : 'Import' }}
          </button>
        </div>

        <p v-if="importError" class="text-[13px] text-red-500 mt-3">{{ importError }}</p>
        <p v-if="importResult" class="text-[13px] text-emerald-500 mt-3">{{ importResult }}</p>
      </section>

      <!-- Nextcloud Backup -->
      <section class="bg-app-card border border-app-border rounded-2xl p-7 w-full max-w-[480px]">
        <h2 class="text-[15px] font-bold text-app-text mb-5">Nextcloud Backup</h2>

        <p v-if="nextcloudLoading" class="text-[13px] text-app-muted">Loading…</p>

        <div v-else-if="!nextcloud.connected" class="flex items-center justify-between gap-4">
          <div class="flex flex-col gap-[3px] text-sm font-medium text-app-text">
            <span>Connect</span>
            <span class="text-xs text-app-muted font-normal">Link Nextcloud to back up and restore boards, items and tags</span>
          </div>
          <a
            href="/auth/nextcloud"
            class="btn-secondary inline-flex items-center gap-[6px] bg-app-card border border-app-border shadow-brutal-sm rounded-lg py-[7px] px-[14px] text-[13px] font-medium text-app-text no-underline whitespace-nowrap transition-colors duration-150 hover:bg-app-hover focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
          >
            Connect Nextcloud
          </a>
        </div>

        <template v-else>
          <div class="flex flex-col gap-[3px] text-sm font-medium text-app-text mb-5">
            <span>{{ nextcloud.serverUrl }}</span>
            <span class="text-xs text-app-muted font-normal">Connected since {{ formattedConnectedAt }}</span>
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            <button
              class="btn-secondary inline-flex items-center gap-[6px] bg-app-card border border-app-border shadow-brutal-sm rounded-lg py-[7px] px-[14px] text-[13px] font-medium text-app-text cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-app-hover focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
              :disabled="backingUp"
              @click="backupNow"
            >
              {{ backingUp ? 'Backing up…' : 'Back up now' }}
            </button>
            <button
              class="btn-secondary inline-flex items-center gap-[6px] bg-app-card border border-app-border shadow-brutal-sm rounded-lg py-[7px] px-[14px] text-[13px] font-medium text-app-text cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-app-hover focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
              :disabled="restoring"
              @click="restoreNow"
            >
              {{ restoring ? 'Restoring…' : 'Restore from Nextcloud' }}
            </button>
            <button
              class="ml-auto bg-transparent border-none text-[13px] text-app-muted cursor-pointer underline disabled:opacity-50 disabled:cursor-not-allowed focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
              :disabled="disconnecting"
              @click="disconnectNextcloud"
            >
              {{ disconnecting ? 'Disconnecting…' : 'Disconnect' }}
            </button>
          </div>
        </template>

        <p v-if="nextcloudError" class="text-[13px] text-red-500 mt-3">{{ nextcloudError }}</p>
        <p v-if="nextcloudResult" class="text-[13px] text-emerald-500 mt-3">{{ nextcloudResult }}</p>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { useKanbanStore } from '~/stores/kanban'

const { theme, apply } = useTheme()
const kanban = useKanbanStore()

// Export
const exporting = ref(false)

async function exportData() {
  exporting.value = true
  try {
    const data = await $fetch('/api/export')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kanban-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    exporting.value = false
  }
}

// Import
const importFile = ref<File | null>(null)
const importing = ref(false)
const importError = ref('')
const importResult = ref('')

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  importFile.value = file
  importError.value = ''
  importResult.value = ''
}

async function importData() {
  if (!importFile.value) return
  importError.value = ''
  importResult.value = ''
  importing.value = true
  try {
    const text = await importFile.value.text()
    const json = JSON.parse(text)
    const result = await $fetch<{ importedBoards: number; importedItems: number; importedTags: number; importedComments: number }>('/api/import', {
      method: 'POST',
      body: json,
    })
    importResult.value = `Imported ${result.importedBoards} board(s), ${result.importedItems} item(s), ${result.importedTags} tag(s), ${result.importedComments} comment(s).`
    importFile.value = null
    await kanban.init()
  } catch (e: any) {
    importError.value = e?.data?.message ?? 'Import failed — make sure the file is a valid export.'
  } finally {
    importing.value = false
  }
}

// Nextcloud
const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()

interface NextcloudStatus { connected: boolean; serverUrl?: string; connectedAt?: string }

const nextcloud = ref<NextcloudStatus>({ connected: false })
const nextcloudLoading = ref(true)
const backingUp = ref(false)
const restoring = ref(false)
const disconnecting = ref(false)
const nextcloudError = ref('')
const nextcloudResult = ref('')

const formattedConnectedAt = computed(() =>
  nextcloud.value.connectedAt ? new Date(nextcloud.value.connectedAt).toLocaleDateString() : ''
)

async function loadNextcloudStatus() {
  nextcloudLoading.value = true
  try {
    nextcloud.value = await $fetch<NextcloudStatus>('/api/nextcloud/status')
  } finally {
    nextcloudLoading.value = false
  }
}

onMounted(async () => {
  await loadNextcloudStatus()

  if (route.query.nextcloud === 'connected') {
    nextcloudResult.value = 'Nextcloud connected.'
  } else if (route.query.nextcloud === 'error') {
    nextcloudError.value = 'Could not connect to Nextcloud. Please try again.'
  }
  if (route.query.nextcloud) {
    const { nextcloud: _discard, ...rest } = route.query
    router.replace({ query: rest })
  }
})

async function backupNow() {
  const ok = await confirm({
    message: 'Back up all boards, items and tags to Nextcloud now? This overwrites the previous kanban-backup.json.',
    confirmLabel: 'Back up',
  })
  if (!ok) return

  nextcloudError.value = ''
  nextcloudResult.value = ''
  backingUp.value = true
  try {
    const result = await $fetch<{ boards: number; items: number; tags: number; comments: number }>('/api/nextcloud/backup', {
      method: 'POST',
    })
    nextcloudResult.value = `Backed up ${result.boards} board(s), ${result.items} item(s), ${result.tags} tag(s), ${result.comments} comment(s).`
  } catch (e: any) {
    nextcloudError.value = e?.data?.message ?? 'Backup failed.'
  } finally {
    backingUp.value = false
  }
}

async function restoreNow() {
  const { confirmed, checked } = await confirm({
    message: 'Restore boards, items and tags from the latest Nextcloud backup.',
    confirmLabel: 'Restore',
    checkbox: { label: 'Replace existing data instead of merging', defaultChecked: true },
  })
  if (!confirmed) return

  nextcloudError.value = ''
  nextcloudResult.value = ''
  restoring.value = true
  try {
    const result = await $fetch<{ importedBoards: number; importedItems: number; importedTags: number; importedComments: number }>('/api/nextcloud/restore', {
      method: 'POST',
      body: { replace: checked },
    })
    nextcloudResult.value = `Restored ${result.importedBoards} board(s), ${result.importedItems} item(s), ${result.importedTags} tag(s), ${result.importedComments} comment(s).`
    await kanban.init()
  } catch (e: any) {
    nextcloudError.value = e?.data?.message ?? 'Restore failed.'
  } finally {
    restoring.value = false
  }
}

async function disconnectNextcloud() {
  disconnecting.value = true
  try {
    await $fetch('/api/nextcloud/disconnect', { method: 'POST' })
    nextcloud.value = { connected: false }
    nextcloudResult.value = 'Nextcloud disconnected.'
  } finally {
    disconnecting.value = false
  }
}
</script>

<style scoped>
.btn-primary:hover:not(:disabled) { transform: translate(1px, 1px); box-shadow: none; }
.theme-btn:not(.bg-app-card):hover { color: var(--text); }
</style>
