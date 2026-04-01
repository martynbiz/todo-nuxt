import { ref } from 'vue'

interface ModalState {
  boardId: string
  itemId: string | null // null = new item
}

const state = ref<ModalState | null>(null)
let triggerEl: HTMLElement | null = null

export function useItemModal() {
  function openNew(boardId: string = '') {
    triggerEl = document.activeElement as HTMLElement
    state.value = { boardId, itemId: null }
  }

  function openExisting(boardId: string, itemId: string) {
    triggerEl = document.activeElement as HTMLElement
    state.value = { boardId, itemId }
  }

  function close() {
    state.value = null
    triggerEl?.focus()
    triggerEl = null
  }

  return { state, openNew, openExisting, close }
}
