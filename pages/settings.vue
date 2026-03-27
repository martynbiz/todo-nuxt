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
          <button class="btn-secondary inline-flex items-center gap-[6px] bg-transparent border border-app-border rounded-lg py-[7px] px-[14px] text-[13px] font-medium text-app-text cursor-pointer whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:border-app-muted" :disabled="exporting" @click="exportData">
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
          <label class="btn-file inline-flex items-center gap-[6px] bg-transparent border border-app-border rounded-lg py-[7px] px-[14px] text-[13px] font-medium text-app-text cursor-pointer whitespace-nowrap transition-colors duration-150 relative overflow-hidden hover:border-app-muted">
            <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Choose file
            <input type="file" accept=".json,application/json" class="absolute inset-0 opacity-0 cursor-pointer text-[0px]" @change="onFileChange" />
          </label>
        </div>

        <div v-if="importFile" class="flex items-center gap-3 mt-4 flex-wrap">
          <span class="flex-1 text-[13px] text-app-muted overflow-hidden text-ellipsis whitespace-nowrap">{{ importFile.name }}</span>
          <button class="btn-primary bg-app-accent text-white border-none rounded-lg py-2 px-[18px] text-[13px] font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed" :disabled="importing" @click="importData">
            {{ importing ? 'Importing…' : 'Import' }}
          </button>
        </div>

        <p v-if="importError" class="text-[13px] text-red-500 mt-3">{{ importError }}</p>
        <p v-if="importResult" class="text-[13px] text-emerald-500 mt-3">{{ importResult }}</p>
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
    const result = await $fetch<{ importedBoards: number; importedItems: number; importedTags: number }>('/api/import', {
      method: 'POST',
      body: json,
    })
    importResult.value = `Imported ${result.importedBoards} board(s), ${result.importedItems} item(s), ${result.importedTags} tag(s).`
    importFile.value = null
    await kanban.init()
  } catch (e: any) {
    importError.value = e?.data?.message ?? 'Import failed — make sure the file is a valid export.'
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.theme-btn:not(.bg-app-card):hover { color: var(--text); }
</style>
