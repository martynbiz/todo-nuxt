import { useAuthStore } from '~/stores/auth'
import { useKanbanStore } from '~/stores/kanban'

export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  const kanban = useKanbanStore()
  if (auth.user) {
    const headers = { ...useRequestHeaders(['cookie']) }
    await kanban.init(headers)
  }
})
