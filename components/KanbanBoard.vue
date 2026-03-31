<template>
  <div
    class="kanban-board bg-app-board border border-app-border rounded-xl w-[288px] shrink-0 flex flex-col transition-[border-color,box-shadow] duration-150 min-h-[120px] overflow-hidden"
    :class="{ 'border-app-accent shadow-[0_0_0_2px_var(--accent-glow)]': isDragOver }"
    role="region"
    :aria-label="board.title"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Board header -->
    <div
      class="flex items-center justify-between px-4 pt-3 pb-2 cursor-grab"
      draggable="true"
      @dragstart="onBoardDragStart"
      @dragend="onBoardDragEnd"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span
          v-if="!editingTitle"
          class="board-title font-bold text-[13px] text-app-text select-none truncate"
          @dblclick="startEditTitle"
        >{{ board.title }}</span>
        <button
          v-if="!editingTitle"
          class="board-rename bg-transparent border-none text-app-muted cursor-pointer leading-none px-[2px] opacity-0 transition-opacity duration-100 shrink-0 focus:opacity-100 focus:outline-2 focus:outline-black rounded"
          :aria-label="`Rename board ${board.title}`"
          @click.stop="startEditTitle"
        >
          <svg class="w-[11px] h-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <input
          v-else
          ref="titleInput"
          v-model="titleDraft"
          class="flex-1 bg-app-input border border-app-accent rounded text-[13px] font-bold text-app-text outline-none py-[2px] px-[6px]"
          @blur="saveTitle"
          @keydown.enter="saveTitle"
          @keydown.esc="editingTitle = false"
        />
        <span
          class="shrink-0 text-[11px] font-bold px-[8px] py-[1px] rounded-full"
          :style="{ backgroundColor: accentColor + '22', color: accentColor }"
        >{{ visibleItems.length }}</span>
      </div>
      <button
        class="board-delete bg-transparent border-none text-app-muted text-lg cursor-pointer leading-none px-1 opacity-0 transition-opacity duration-100 shrink-0 ml-1"
        :aria-label="`Delete board ${board.title}`"
        @click="confirmRemoveBoard"
      >×</button>
    </div>

    <!-- Items list -->
    <div class="flex flex-col flex-1 px-3 pb-1">
      <div
        v-for="(item, index) in visibleItems"
        :key="item.id"
        class="relative py-[3px]"
        @dragover.prevent="onItemDragOver(index, $event)"
      >
        <div
          class="h-[2px] rounded-full mb-[2px] transition-opacity duration-100"
          :style="{ backgroundColor: accentColor, opacity: dropIndex === index ? 1 : 0 }"
        />
        <KanbanItem :item="item" :board-id="board.id" />
      </div>
      <div
        class="relative py-[3px]"
        @dragover.prevent="onItemDragOver(visibleItems.length, $event)"
      >
        <div
          class="h-[2px] rounded-full mb-[2px] transition-opacity duration-100"
          :style="{ backgroundColor: accentColor, opacity: dropIndex === visibleItems.length ? 1 : 0 }"
        />
      </div>
    </div>

    <!-- Add item -->
    <div class="px-3 pb-3 pt-1">
      <button
        class="btn-add-item w-full flex items-center justify-center gap-[6px] bg-transparent border border-dashed border-app-border rounded-lg text-app-muted text-[12px] font-medium py-[9px] cursor-pointer transition-[border-color,color,background] duration-150 hover:border-app-accent hover:text-app-accent hover:bg-app-hover"
        :aria-label="`Add item to ${board.title}`"
        @click="modal.openNew(board.id)"
      >
        <svg class="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add item
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Board } from '~/stores/kanban'
import { useKanbanStore } from '~/stores/kanban'

const props = defineProps<{ board: Board; boardIndex: number }>()
const emit = defineEmits<{
  remove: [id: string]
  boardDragStart: [index: number]
  boardDrop: [toIndex: number]
}>()

const COLUMN_ACCENTS = ['#f472b6', '#fb923c', '#34d399', '#60a5fa', '#a78bfa', '#f59e0b', '#ef4444']
const accentColor = computed(() => COLUMN_ACCENTS[props.boardIndex % COLUMN_ACCENTS.length])

const store = useKanbanStore()
const visibleItems = computed(() => store.visibleItems(props.board.id))
const { confirm } = useConfirm()

async function confirmRemoveBoard() {
  const ok = await confirm({ message: `Delete board "${props.board.title}"?` })
  if (ok) emit('remove', props.board.id)
}

// Title editing
const editingTitle = ref(false)
const titleDraft = ref(props.board.title)
const titleInput = ref<HTMLInputElement | null>(null)

function startEditTitle() {
  titleDraft.value = props.board.title
  editingTitle.value = true
  nextTick(() => titleInput.value?.select())
}
function saveTitle() {
  const t = titleDraft.value.trim()
  if (t) store.renameBoard(props.board.id, t)
  editingTitle.value = false
}

const modal = useItemModal()

// Item drag + drop
const isDragOver = ref(false)
const dropIndex = ref<number | null>(null)

function onDragOver(e: DragEvent) {
  if (e.dataTransfer?.types.includes('text/plain')) {
    isDragOver.value = true
  }
}
function onDragLeave() {
  isDragOver.value = false
  dropIndex.value = null
}
function onItemDragOver(index: number, e: DragEvent) {
  if (e.dataTransfer?.types.includes('text/plain')) {
    dropIndex.value = index
  }
}
function onDrop(e: DragEvent) {
  isDragOver.value = false
  const raw = e.dataTransfer?.getData('text/plain')
  if (!raw) return
  try {
    const data = JSON.parse(raw)
    if (data.boardDrag !== undefined) return // board reorder handled in parent
    const { boardId: fromBoardId, index: fromIndex } = data
    const toIndex = dropIndex.value ?? visibleItems.value.length
    store.moveItem(fromBoardId, fromIndex, props.board.id, toIndex)
  } catch {}
  dropIndex.value = null
}

// Board drag
function onBoardDragStart(e: DragEvent) {
  e.dataTransfer?.setData('text/plain', JSON.stringify({ boardDrag: true, index: props.boardIndex }))
  e.dataTransfer!.effectAllowed = 'move'
  emit('boardDragStart', props.boardIndex)
}
function onBoardDragEnd() {}
</script>

<style scoped>
.kanban-board:hover .board-delete,
.kanban-board:hover .board-rename { opacity: 0.5; }
.board-delete:hover, .board-delete:focus { opacity: 1 !important; color: #ef4444; outline: 2px solid black; }
.board-rename:hover, .board-rename:focus { opacity: 1 !important; color: var(--text); }
</style>
