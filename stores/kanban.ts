import { defineStore } from 'pinia'

export interface Tag {
  id: string
  label: string
  color: string
}

export interface Item {
  id: string
  title: string
  description: string
  tags: string[]
}

export interface Board {
  id: string
  title: string
  items: Item[]
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
]

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export const useKanbanStore = defineStore('kanban', {
  state: () => ({
    boards: [] as Board[],
    tags: [] as Tag[],
    filterTags: [] as string[],
  }),

  getters: {
    visibleItems: (state) => (boardId: string) => {
      const board = state.boards.find(b => b.id === boardId)
      if (!board) return []
      if (state.filterTags.length === 0) return board.items
      return board.items.filter(item => item.tags.some(t => state.filterTags.includes(t)))
    },
  },

  actions: {
    async init() {
      const data = await $fetch<{ boards: Board[], tags: Tag[] }>('/api/state')
      this.boards = data.boards
      this.tags = data.tags
    },

    async addBoard(title: string) {
      const id = uid()
      const position = this.boards.length
      this.boards.push({ id, title, items: [] })
      await $fetch('/api/boards', { method: 'POST', body: { id, title, position } })
    },

    async removeBoard(boardId: string) {
      this.boards = this.boards.filter(b => b.id !== boardId)
      await $fetch(`/api/boards/${boardId}`, { method: 'DELETE' })
    },

    async renameBoard(boardId: string, title: string) {
      const board = this.boards.find(b => b.id === boardId)
      if (board) board.title = title
      await $fetch(`/api/boards/${boardId}`, { method: 'PATCH', body: { title } })
    },

    async moveBoard(fromIndex: number, toIndex: number) {
      const boards = [...this.boards]
      const [moved] = boards.splice(fromIndex, 1)
      boards.splice(toIndex, 0, moved)
      this.boards = boards
      await $fetch('/api/boards/positions', {
        method: 'POST',
        body: { positions: boards.map((b, i) => ({ id: b.id, position: i })) },
      })
    },

    async addItem(boardId: string, title: string, description = '', tags: string[] = []) {
      const id = uid()
      const board = this.boards.find(b => b.id === boardId)
      if (!board) return
      const position = board.items.length
      board.items.push({ id, title, description, tags })
      await $fetch('/api/items', { method: 'POST', body: { id, boardId, title, description, tags, position } })
    },

    async removeItem(boardId: string, itemId: string) {
      const board = this.boards.find(b => b.id === boardId)
      if (board) board.items = board.items.filter(i => i.id !== itemId)
      await $fetch(`/api/items/${itemId}`, { method: 'DELETE' })
    },

    async updateItem(boardId: string, itemId: string, patch: Partial<Item>) {
      const board = this.boards.find(b => b.id === boardId)
      if (!board) return
      const item = board.items.find(i => i.id === itemId)
      if (item) Object.assign(item, patch)
      await $fetch(`/api/items/${itemId}`, { method: 'PATCH', body: patch })
    },

    async moveItem(fromBoardId: string, fromIndex: number, toBoardId: string, toIndex: number) {
      const fromBoard = this.boards.find(b => b.id === fromBoardId)
      const toBoard = this.boards.find(b => b.id === toBoardId)
      if (!fromBoard || !toBoard) return
      const [item] = fromBoard.items.splice(fromIndex, 1)
      toBoard.items.splice(toIndex, 0, item)
      await $fetch('/api/items/move', {
        method: 'POST',
        body: {
          itemId: item.id,
          fromBoardId,
          toBoardId,
          fromOrder: fromBoard.items.map(i => i.id),
          toOrder: toBoard.items.map(i => i.id),
        },
      })
    },

    async addTag(label: string) {
      const existing = this.tags.find(t => t.label.toLowerCase() === label.toLowerCase())
      if (existing) return existing
      const id = uid()
      const color = TAG_COLORS[this.tags.length % TAG_COLORS.length]
      const tag: Tag = { id, label, color }
      this.tags.push(tag)
      await $fetch('/api/tags', { method: 'POST', body: { id, label, color } })
      return tag
    },

    async removeTag(tagId: string) {
      this.tags = this.tags.filter(t => t.id !== tagId)
      this.filterTags = this.filterTags.filter(id => id !== tagId)
      for (const board of this.boards) {
        for (const item of board.items) {
          item.tags = item.tags.filter(t => t !== tagId)
        }
      }
      await $fetch(`/api/tags/${tagId}`, { method: 'DELETE' })
    },

    toggleFilterTag(tagId: string) {
      if (this.filterTags.includes(tagId)) {
        this.filterTags = this.filterTags.filter(id => id !== tagId)
      } else {
        this.filterTags.push(tagId)
      }
    },
  },
})
