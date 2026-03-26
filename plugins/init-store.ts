import { useKanbanStore } from '~/stores/kanban'

export default defineNuxtPlugin(async () => {
  const store = useKanbanStore()
  await store.init()
})
