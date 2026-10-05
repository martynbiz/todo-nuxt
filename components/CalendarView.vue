<template>
  <main id="main-content" class="p-6 max-w-2xl mx-auto w-full">
    <div v-if="groups.length === 0 && store.searchQuery.trim()" class="flex flex-col items-center justify-center gap-2 text-app-muted p-16">
      <p class="text-[15px] font-semibold text-app-text">No matching cards</p>
      <p class="text-[13px]">Nothing with a due date matches “{{ store.searchQuery.trim() }}”</p>
    </div>
    <div v-else-if="groups.length === 0" class="flex flex-col items-center justify-center gap-3 text-app-muted p-16">
      <svg class="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <p class="text-[15px] font-semibold text-app-text">No items with due dates</p>
      <p class="text-[13px]">Set a due date on any item to see it here</p>
    </div>

    <ol v-else class="flex flex-col gap-6" aria-label="Items grouped by due date">
      <li v-for="group in groups" :key="group.date">
        <h2 class="text-[13px] font-semibold text-app-muted uppercase tracking-[0.06em] mb-3 flex items-center gap-2">
          <span :class="group.isPast ? 'text-app-danger' : ''">{{ group.heading }}</span>
          <span
            v-if="group.isPast"
            class="text-[10px] font-bold px-[6px] py-[1px] rounded-full bg-app-danger/15 text-app-danger"
          >Overdue</span>
        </h2>
        <ul class="flex flex-col gap-2" :aria-label="`Items due ${group.heading}`">
          <li v-for="item in group.items" :key="item.id" class="calendar-item relative">
            <button
              class="w-full text-left bg-app-card border border-app-border rounded-xl py-3 pl-4 pr-11 shadow-card hover:border-app-accent/40 hover:shadow-card-hover transition-all duration-150 focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
              :aria-label="`Open item: ${item.title}`"
              @click="modal.openExisting(item.boardId, item.id)"
            >
              <span class="block text-[14px] font-medium text-app-text leading-snug" :class="item.tags.length > 0 ? 'mb-1' : ''">
                {{ item.title }}
              </span>
              <div class="flex flex-wrap gap-1" v-if="item.tags.length > 0">
                <TagBadge
                  v-for="tagId in item.tags"
                  :key="tagId"
                  :tag="store.tags.find(t => t.id === tagId)!"
                />
              </div>
            </button>
            <ItemActionsMenu :item="item" :board-id="item.boardId" show-board class="absolute top-2 right-2" />
          </li>
        </ul>
      </li>
    </ol>
  </main>
</template>

<script setup lang="ts">
import { useKanbanStore } from '~/stores/kanban'

const store = useKanbanStore()
const modal = useItemModal()
const { formatDueDate, isPastDue } = useDateFormat()

const groups = computed(() => {
  const byDate = new Map<string, typeof store.itemsWithDueDate>()
  for (const item of store.itemsWithDueDate.filter(i => store.matchesSearch(i))) {
    const key = item.due_date!
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(item)
  }
  return Array.from(byDate.entries()).map(([date, items]) => ({
    date,
    heading: formatDueDate(date) ?? date,
    isPast: isPastDue(date),
    items,
  }))
})
</script>

<style scoped>
.calendar-item :deep(.item-actions-trigger) { opacity: 0; }
.calendar-item:hover :deep(.item-actions-trigger) { opacity: 0.7; }
.calendar-item :deep(.item-actions-trigger:hover),
.calendar-item :deep(.item-actions-trigger:focus),
.calendar-item :deep(.is-open .item-actions-trigger) { opacity: 1; }
@media (hover: none) {
  .calendar-item :deep(.item-actions-trigger) { opacity: 0.7; }
}
</style>
