<template>
  <div
    class="kanban-board bg-app-board rounded-2xl w-full flex flex-col transition-shadow duration-150 min-h-[120px] overflow-hidden"
    :class="{ 'shadow-[0_0_0_2px_var(--accent)]': isDragOver }"
    :style="{ '--tint': tintVar }"
    role="region"
    :aria-label="board.title"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Board header -->
    <div
      class="board-header flex items-center justify-between px-4 pt-3 pb-2 cursor-grab"
      draggable="true"
      @dragstart="onBoardDragStart"
      @dragend="onBoardDragEnd"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: tintVar }" aria-hidden="true" />
        <span
          v-if="!editingTitle"
          class="board-title font-semibold text-sm text-app-text select-none truncate"
          @dblclick="startEditTitle"
        >{{ board.title }}</span>
        <button
          v-if="!editingTitle"
          class="board-rename bg-transparent border-none text-app-muted cursor-pointer leading-none px-[2px] opacity-0 transition-opacity duration-100 shrink-0 focus:opacity-100 focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2 rounded"
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
          class="flex-1 bg-app-input border border-app-accent rounded-md text-sm font-semibold text-app-text outline-none py-[2px] px-[6px] focus:ring-2 focus:ring-app-accent/30"
          @blur="saveTitle"
          @keydown.enter="saveTitle"
          @keydown.esc="editingTitle = false"
        />
        <span
          class="shrink-0 text-[11px] font-semibold px-[8px] py-[1px] rounded-full bg-app-hover text-app-muted"
        >{{ visibleItems.length }}</span>
      </div>
      <button
        class="board-delete bg-transparent border-none text-app-muted cursor-pointer leading-none p-1 rounded-md opacity-0 transition-opacity duration-100 shrink-0 ml-1"
        :aria-label="`Delete board ${board.title}`"
        @click="confirmRemoveBoard"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Items list -->
    <div class="flex flex-col flex-1 px-3 pb-2">
      <div
        v-for="(item, index) in visibleItems"
        :key="item.id"
        class="relative py-[3px]"
        @dragover.prevent="onItemDragOver(index, $event)"
      >
        <div
          class="h-[2px] rounded-full bg-app-accent mb-[2px] transition-opacity duration-100"
          :style="{ opacity: dropIndex === index ? 1 : 0 }"
        />
        <KanbanItem :item="item" :board-id="board.id" />
      </div>
      <div
        class="relative py-[3px]"
        @dragover.prevent="onItemDragOver(visibleItems.length, $event)"
      >
        <div
          class="h-[2px] rounded-full bg-app-accent mb-[2px] transition-opacity duration-100"
          :style="{ opacity: dropIndex === visibleItems.length ? 1 : 0 }"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Board } from '~/stores/kanban'
import { useKanbanStore } from '~/stores/kanban'

const props = defineProps<{ board: Board; boardIndex: number; autoFocusTitle?: boolean }>()
const emit = defineEmits<{
  remove: [id: string]
  boardDragStart: [index: number]
  boardDrop: [toIndex: number]
}>()

const store = useKanbanStore()
// Decorative tint cycling through the 6 palette tints by board position
const tintVar = computed(() => `var(--col-tint-${(props.boardIndex % 6) + 1})`)
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

onMounted(() => {
  if (props.autoFocusTitle) startEditTitle()
})

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
    const toIndex = toFullIndex(dropIndex.value ?? visibleItems.value.length)
    store.moveItem(fromBoardId, fromIndex, props.board.id, toIndex)
  } catch {}
  dropIndex.value = null
}

// dropIndex is relative to visibleItems; when a tag filter or search hides cards,
// translate it to a position in the full board.items list
function toFullIndex(visibleIndex: number) {
  const all = props.board.items
  const visible = visibleItems.value
  if (visible.length === all.length) return visibleIndex
  if (visibleIndex < visible.length) return all.indexOf(visible[visibleIndex])
  return visible.length ? all.indexOf(visible[visible.length - 1]) + 1 : all.length
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
.board-delete:hover, .board-delete:focus { opacity: 1 !important; color: var(--danger); background: var(--hover-bg); }
.board-delete:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.board-rename:hover, .board-rename:focus { opacity: 1 !important; color: var(--text); }
.board-header {
  background: linear-gradient(to bottom, color-mix(in srgb, var(--tint) calc(var(--col-wash) * 100%), transparent), transparent);
}
</style>
