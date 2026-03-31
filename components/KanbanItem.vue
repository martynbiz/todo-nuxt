<template>
  <div
    class="kanban-item bg-app-card border border-app-border rounded-xl py-3 px-3 cursor-pointer transition-all duration-150 relative shadow-sm hover:shadow-md hover:border-app-accent/40 hover:-translate-y-px focus:outline-2 focus:outline-black"
    :class="{ 'opacity-40 cursor-grabbing': isDragging }"
    role="button"
    :aria-label="item.title"
    tabindex="0"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="onCardClick"
    @keydown.self.enter.prevent="onCardClick"
    @keydown.self.space.prevent="onCardClick"
  >
    <!-- Title row -->
    <div class="flex items-start gap-2 mb-[8px]">
      <span class="flex-1 text-[20px] md:text-base font-medium leading-snug break-words text-app-text">{{ item.title }}</span>
      <button
        class="item-delete bg-transparent border-none text-app-muted text-base cursor-pointer px-[2px] leading-none opacity-0 transition-opacity duration-100 shrink-0 mt-[1px]"
        :aria-label="`Delete ${item.title}`"
        @click.stop="confirmRemoveItem"
      >×</button>
    </div>

    <!-- Tags + description indicator -->
    <div class="flex items-center justify-between gap-2" v-if="item.tags.length > 0 || hasDescription">
      <div class="flex flex-wrap gap-1 flex-1" v-if="item.tags.length > 0">
        <TagBadge
          v-for="tagId in item.tags"
          :key="tagId"
          :tag="store.tags.find(t => t.id === tagId)!"
        />
      </div>
      <svg v-if="hasDescription" class="w-[11px] h-[11px] text-app-muted shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" title="Has description">
        <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
      </svg>
    </div>

    <!-- Due date chip -->
    <div v-if="dueDateLabel" class="flex items-center gap-1 mt-[6px]">
      <svg class="w-[10px] h-[10px] shrink-0" :class="isPast ? 'text-red-400' : 'text-app-muted'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span class="text-[11px] font-medium" :class="isPast ? 'text-red-400' : 'text-app-muted'">{{ dueDateLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '~/stores/kanban'
import { useKanbanStore } from '~/stores/kanban'

const props = defineProps<{ item: Item; boardId: string }>()
const store = useKanbanStore()
const modal = useItemModal()
const { confirm } = useConfirm()
const { formatDueDate, isPastDue } = useDateFormat()

const dueDateLabel = computed(() => formatDueDate(props.item.due_date))
const isPast = computed(() => !!props.item.due_date && isPastDue(props.item.due_date))

async function confirmRemoveItem() {
  const ok = await confirm({ message: `Delete "${props.item.title}"?` })
  if (ok) store.removeItem(props.boardId, props.item.id)
}

const hasDescription = computed(() =>
  !!props.item.description?.replace(/<[^>]*>/g, '').trim()
)

const isDragging = ref(false)
let justDragged = false

function onCardClick() {
  if (justDragged) return
  modal.openExisting(props.boardId, props.item.id)
}

function onDragStart(e: DragEvent) {
  isDragging.value = true
  justDragged = false
  const board = store.boards.find(b => b.id === props.boardId)
  const index = board?.items.findIndex(i => i.id === props.item.id) ?? -1
  e.dataTransfer?.setData('text/plain', JSON.stringify({ itemId: props.item.id, boardId: props.boardId, index }))
  e.dataTransfer!.effectAllowed = 'move'
}

function onDragEnd() {
  isDragging.value = false
  justDragged = true
  setTimeout(() => { justDragged = false }, 100)
}
</script>

<style scoped>
.kanban-item:hover .item-delete { opacity: 0.6; }
.item-delete:hover, .item-delete:focus { opacity: 1 !important; color: #ef4444; }
</style>
