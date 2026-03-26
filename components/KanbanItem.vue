<template>
  <div
    class="kanban-item"
    :class="{ 'is-dragging': isDragging }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="onCardClick"
  >
    <div class="item-header">
      <span class="item-title">{{ item.title }}</span>
      <button class="item-delete" @click.stop="confirmRemoveItem" title="Delete item">×</button>
    </div>

    <div class="item-tags" v-if="item.tags.length > 0">
      <TagBadge
        v-for="tagId in item.tags"
        :key="tagId"
        :tag="store.tags.find(t => t.id === tagId)!"
      />
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

async function confirmRemoveItem() {
  const ok = await confirm({ message: `Delete "${props.item.title}"?` })
  if (ok) store.removeItem(props.boardId, props.item.id)
}

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
.kanban-item {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, opacity 0.15s, border-color 0.15s;
  position: relative;
}
.kanban-item:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.kanban-item.is-dragging {
  opacity: 0.4;
  cursor: grabbing;
}

.item-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.item-title {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.item-delete {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.1s;
  flex-shrink: 0;
}
.kanban-item:hover .item-delete { opacity: 0.6; }
.item-delete:hover { opacity: 1 !important; color: #ef4444; }

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
</style>
