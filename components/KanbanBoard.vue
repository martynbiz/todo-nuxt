<template>
  <div
    class="kanban-board"
    :class="{ 'drag-over': isDragOver }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Board header -->
    <div
      class="board-header"
      draggable="true"
      @dragstart="onBoardDragStart"
      @dragend="onBoardDragEnd"
    >
      <span v-if="!editingTitle" class="board-title" @dblclick="startEditTitle">
        {{ board.title }}
        <span class="item-count">{{ visibleItems.length }}</span>
      </span>
      <input
        v-else
        ref="titleInput"
        v-model="titleDraft"
        class="board-title-input"
        @blur="saveTitle"
        @keydown.enter="saveTitle"
        @keydown.esc="editingTitle = false"
      />
      <button class="board-delete" @click="confirmRemoveBoard" title="Delete board">×</button>
    </div>

    <!-- Items list -->
    <div class="board-items">
      <div
        v-for="(item, index) in visibleItems"
        :key="item.id"
        class="item-wrapper"
        @dragover.prevent="onItemDragOver(index, $event)"
      >
        <div class="drop-indicator" :class="{ active: dropIndex === index }" />
        <KanbanItem :item="item" :board-id="board.id" />
      </div>
      <div
        class="item-wrapper"
        @dragover.prevent="onItemDragOver(visibleItems.length, $event)"
      >
        <div class="drop-indicator" :class="{ active: dropIndex === visibleItems.length }" />
      </div>
    </div>

    <!-- Add item -->
    <div class="add-item-area">
      <button class="btn-add-item" @click="modal.openNew(board.id)">+ Add item</button>
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
    const { itemId, boardId: fromBoardId, index: fromIndex } = data
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
.kanban-board {
  background: var(--board-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s, box-shadow 0.15s;
  min-height: 120px;
}
.kanban-board.drag-over {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
  padding: 2px 0;
}
.board-title {
  font-weight: 700;
  font-size: 14px;
  flex: 1;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.item-count {
  background: var(--border);
  color: var(--text-muted);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
}
.board-title-input {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--accent);
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  outline: none;
}

.board-delete {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  opacity: 0;
  transition: opacity 0.1s;
}
.kanban-board:hover .board-delete { opacity: 0.5; }
.board-delete:hover { opacity: 1 !important; color: #ef4444; }

.board-items {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
}
.item-wrapper {
  position: relative;
  padding: 3px 0;
}
.drop-indicator {
  height: 2px;
  border-radius: 1px;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.1s;
  margin-bottom: 2px;
}
.drop-indicator.active { opacity: 1; }

.add-item-area {
  margin-top: 4px;
}
.btn-add-item {
  width: 100%;
  background: none;
  border: 1px dashed var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13px;
  padding: 8px;
  cursor: pointer;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
  text-align: center;
}
.btn-add-item:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--hover-bg);
}

</style>
