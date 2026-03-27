<template>
  <div class="subpage">
    <header class="subpage-header">
      <NuxtLink to="/" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Boards
      </NuxtLink>
      <h1 class="subpage-title">Settings</h1>
      <UserMenu />
    </header>

    <main class="subpage-content">

      <!-- Appearance -->
      <section class="card">
        <h2 class="card-title">Appearance</h2>
        <div class="setting-row">
          <div class="setting-label">
            <span>Theme</span>
            <span class="setting-hint">Choose your preferred colour scheme</span>
          </div>
          <div class="theme-toggle">
            <button
              class="theme-btn"
              :class="{ active: theme === 'dark' }"
              @click="apply('dark')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              Dark
            </button>
            <button
              class="theme-btn"
              :class="{ active: theme === 'light' }"
              @click="apply('light')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              Light
            </button>
          </div>
        </div>
      </section>

      <!-- Data -->
      <section class="card">
        <h2 class="card-title">Data</h2>

        <!-- Export -->
        <div class="setting-row">
          <div class="setting-label">
            <span>Export</span>
            <span class="setting-hint">Download all boards, items and tags as JSON</span>
          </div>
          <button class="btn-secondary" :disabled="exporting" @click="exportData">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {{ exporting ? 'Exporting…' : 'Export JSON' }}
          </button>
        </div>

        <div class="setting-divider" />

        <!-- Import -->
        <div class="setting-row">
          <div class="setting-label">
            <span>Import</span>
            <span class="setting-hint">Restore from a previously exported JSON file</span>
          </div>
          <label class="btn-secondary btn-file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Choose file
            <input type="file" accept=".json,application/json" @change="onFileChange" />
          </label>
        </div>

        <div v-if="importFile" class="import-footer">
          <span class="import-filename">{{ importFile.name }}</span>
          <button class="btn-primary" :disabled="importing" @click="importData">
            {{ importing ? 'Importing…' : 'Import' }}
          </button>
        </div>

        <p v-if="importError" class="msg msg--error">{{ importError }}</p>
        <p v-if="importResult" class="msg msg--success">{{ importResult }}</p>
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

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
.setting-hint {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
}

.theme-toggle {
  display: flex;
  background: var(--bg);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  border-radius: 6px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.theme-btn svg {
  width: 14px;
  height: 14px;
}
.theme-btn.active {
  background: var(--card-bg);
  color: var(--text);
  font-weight: 600;
}
.theme-btn:not(.active):hover {
  color: var(--text);
}

.setting-divider {
  height: 1px;
  background: var(--border);
  margin: 20px 0;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s;
}
.btn-secondary:hover:not(:disabled) { border-color: var(--text-muted); }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary svg { width: 14px; height: 14px; }

.btn-file {
  position: relative;
  overflow: hidden;
}
.btn-file input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  font-size: 0;
}

.import-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.import-filename {
  flex: 1;
  font-size: 13px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-primary {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: filter 0.15s;
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.msg {
  font-size: 13px;
  margin-top: 12px;
}
.msg--error { color: #ef4444; }
.msg--success { color: #10b981; }
</style>
