<template>
  <div class="min-h-screen flex flex-col bg-app-bg">
    <!-- Skip to main content -->
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-app-card focus:text-app-text focus:px-4 focus:py-2 focus:rounded-lg focus:outline-2 focus:outline-black">Skip to content</a>

    <!-- Header -->
    <header class="flex items-center justify-between py-[14px] px-6 border-b border-app-border bg-app-header sticky top-0 z-10">
      <h1 class="text-[17px] font-extrabold tracking-tight text-app-text">Kanban</h1>
      <div class="flex items-center gap-3">
        <button
          class="btn-add-board inline-flex items-center gap-[6px] bg-app-accent text-white border-none rounded-lg py-[7px] px-[14px] text-[13px] font-semibold cursor-pointer"
          @click="openAddBoard"
        >
          <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Board
        </button>
        <UserMenu />
      </div>
    </header>

    <!-- Add board form -->
    <div v-if="showAddBoard" class="flex items-center gap-2 py-3 px-6 bg-app-board border-b border-app-border">
      <input
        ref="boardInput"
        v-model="newBoardTitle"
        class="bg-app-input border border-app-accent rounded-lg py-2 px-3 text-sm text-app-text outline-none w-[240px]"
        placeholder="Board name..."
        @keydown.enter="submitBoard"
        @keydown.esc="showAddBoard = false"
      />
      <button class="btn-confirm bg-app-accent text-white border-none rounded-lg py-2 px-4 text-[13px] font-semibold cursor-pointer" @click="submitBoard">Create</button>
      <button class="border border-app-border rounded-lg py-2 px-3 text-[13px] cursor-pointer text-app-muted bg-transparent hover:border-app-muted hover:text-app-text" @click="showAddBoard = false; newBoardTitle = ''">Cancel</button>
    </div>

    <!-- Tag filter bar -->
    <nav aria-label="Filter by tag" class="flex items-center gap-3 py-[10px] px-6 border-b border-app-border bg-app-header flex-wrap" v-if="usedTags.length > 0">
      <span class="text-xs font-semibold text-app-muted whitespace-nowrap">Filter:</span>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in usedTags"
          :key="tag.id"
          class="inline-flex items-center gap-[4px] py-[5px] px-[12px] rounded-full text-[12px] font-semibold tracking-[0.02em] whitespace-nowrap text-white cursor-pointer select-none transition duration-150 tag-filter-item focus:outline-2 focus:outline-black"
          :class="{ 'opacity-[0.35] grayscale-[0.4]': store.filterTags.length > 0 && !store.filterTags.includes(tag.id) }"
          :style="{ backgroundColor: tag.color }"
          tabindex="0"
          @click="store.toggleFilterTag(tag.id)"
          @keydown.enter.prevent="store.toggleFilterTag(tag.id)"
          @keydown.space.prevent="store.toggleFilterTag(tag.id)"
        >{{ tag.label }}</span>
      </div>
    </nav>

    <!-- Boards -->
    <main
      id="main-content"
      class="flex gap-4 p-6 overflow-x-auto flex-1 items-start"
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

      <div v-if="store.boards.length === 0" class="flex flex-col items-center justify-center gap-3 text-app-muted text-sm p-16 w-full">
        <svg class="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="18" rx="2"/><rect x="14" y="3" width="7" height="11" rx="2"/>
        </svg>
        <p class="text-[15px] font-semibold text-app-text opacity-40">No boards yet</p>
        <p class="text-[13px] opacity-60">Create your first board to get started</p>
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
let addBoardTriggerEl: HTMLElement | null = null

watch(showAddBoard, (val) => {
  if (val) {
    nextTick(() => boardInput.value?.focus())
  } else {
    addBoardTriggerEl?.focus()
    addBoardTriggerEl = null
  }
})

function openAddBoard() {
  addBoardTriggerEl = document.activeElement as HTMLElement
  showAddBoard.value = true
}

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

function onBoardDrop(_toIndex: number) {}
</script>

<style scoped>
.btn-add-board:hover { filter: brightness(1.1); }
.btn-confirm:hover { filter: brightness(1.1); }
.tag-filter-item:hover { filter: brightness(1.15); }
</style>
