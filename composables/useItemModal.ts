import { ref } from 'vue'

interface ModalState {
  boardId: string
  itemId: string | null // null = new item
}

const state = ref<ModalState | null>(null)

export function useItemModal() {
  function openNew(boardId: string) {
    state.value = { boardId, itemId: null }
  }

  function openExisting(boardId: string, itemId: string) {
    state.value = { boardId, itemId }
  }

  function close() {
    state.value = null
  }

  return { state, openNew, openExisting, close }
}
