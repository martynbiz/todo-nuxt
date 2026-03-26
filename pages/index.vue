<template>
  <div class="app">
    <!-- Header -->
    <header class="app-header">
      <h1 class="app-title">Kanban Board</h1>
      <div class="header-actions">
        <button class="btn-add-board" @click="showAddBoard = !showAddBoard">+ Add Board</button>
        <UserMenu />
      </div>
    </header>

    <!-- Add board form -->
    <div v-if="showAddBoard" class="add-board-bar">
      <input
        ref="boardInput"
        v-model="newBoardTitle"
        class="add-board-input"
        placeholder="Board name..."
        @keydown.enter="submitBoard"
        @keydown.esc="showAddBoard = false"
      />
      <button class="btn-confirm" @click="submitBoard">Create</button>
      <button class="btn-cancel" @click="showAddBoard = false">Cancel</button>
    </div>

    <!-- Tag filter bar -->
    <div class="tag-filter-bar" v-if="usedTags.length > 0">
      <span class="filter-label">Filter by tag:</span>
      <div class="tag-filters">
        <TagBadge
          v-for="tag in usedTags"
          :key="tag.id"
          :tag="tag"
          class="tag-filter-item"
          :class="{ 'tag-inactive': store.filterTags.length > 0 && !store.filterTags.includes(tag.id) }"
          @click="store.toggleFilterTag(tag.id)"
        />
      </div>
    </div>

    <!-- Boards -->
    <main
      class="boards-container"
      @dragover.prevent="onBoardAreaDragOver"
      @drop="onBoardAreaDrop"
    >
      <KanbanBoard
        v-for="(board, index) in store.boards"
        :key="board.id"
        :board="board"
        :board-index="index"
        @remove="store.removeBoard"
        @board-drag-start="onBoardDragStart"
        @board-drop="onBoardDrop"
      />

      <div v-if="store.boards.length === 0" class="empty-state">
        <p>No boards yet. Create one to get started!</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useKanbanStore } from '~/stores/kanban'

const store = useKanbanStore()

const usedTags = computed(() => {
  const usedIds = new Set(store.boards.flatMap(b => b.items.flatMap(i => i.tags)))
  return store.tags.filter(t => usedIds.has(t.id))
})

// Add board
const showAddBoard = ref(false)
const newBoardTitle = ref('')
const boardInput = ref<HTMLInputElement | null>(null)

watch(showAddBoard, (val) => {
  if (val) nextTick(() => boardInput.value?.focus())
})

function submitBoard() {
  const t = newBoardTitle.value.trim()
  if (t) {
    store.addBoard(t)
    newBoardTitle.value = ''
    showAddBoard.value = false
  }
}

// Board drag + drop reorder
const draggingBoardIndex = ref<number | null>(null)

function onBoardDragStart(index: number) {
  draggingBoardIndex.value = index
}

function onBoardAreaDragOver(e: DragEvent) {
  e.preventDefault()
}

function onBoardAreaDrop(e: DragEvent) {
  const raw = e.dataTransfer?.getData('text/plain')
  if (!raw) return
  try {
    const data = JSON.parse(raw)
    if (data.boardDrag) {
      // Find which board column we dropped on
      const target = (e.target as HTMLElement).closest('.kanban-board')
      if (!target) return
      const boards = document.querySelectorAll('.kanban-board')
      const toIndex = Array.from(boards).indexOf(target as Element)
      if (toIndex !== -1 && toIndex !== data.index) {
        store.moveBoard(data.index, toIndex)
      }
    }
  } catch {}
  draggingBoardIndex.value = null
}

function onBoardDrop(toIndex: number) {}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
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

.app-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--text);
}


.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-add-board {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.1s;
}
.btn-add-board:hover { filter: brightness(1.1); }

.add-board-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--board-bg);
  border-bottom: 1px solid var(--border);
}
.add-board-input {
  background: var(--input-bg);
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text);
  outline: none;
  width: 240px;
}
.btn-confirm {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-confirm:hover { filter: brightness(1.1); }
.btn-cancel {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-muted);
}
.btn-cancel:hover { border-color: var(--text-muted); color: var(--text); }

.tag-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--header-bg);
  flex-wrap: wrap;
}
.filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}
.tag-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-filter-item {
  cursor: pointer;
  user-select: none;
  transition: filter 0.15s, opacity 0.15s;
}
.tag-filter-item:hover { filter: brightness(1.15); }
.tag-inactive {
  opacity: 0.35;
  filter: grayscale(0.4);
}

.boards-container {
  display: flex;
  gap: 16px;
  padding: 24px;
  overflow-x: auto;
  flex: 1;
  align-items: flex-start;
}

.empty-state {
  color: var(--text-muted);
  font-size: 14px;
  padding: 40px;
}
</style>
