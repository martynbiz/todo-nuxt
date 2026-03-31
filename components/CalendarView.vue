<template>
  <main id="main-content" class="p-6 max-w-2xl mx-auto w-full">
    <div v-if="groups.length === 0" class="flex flex-col items-center justify-center gap-3 text-app-muted p-16">
      <svg class="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <p class="text-[15px] font-semibold text-app-text opacity-40">No items with due dates</p>
      <p class="text-[13px] opacity-60">Set a due date on any item to see it here</p>
    </div>

    <ol v-else class="flex flex-col gap-6" aria-label="Items grouped by due date">
      <li v-for="group in groups" :key="group.date">
        <h2 class="text-[13px] font-semibold text-app-muted uppercase tracking-[0.06em] mb-3 flex items-center gap-2">
          <span :class="group.isPast ? 'text-red-400' : ''">{{ group.heading }}</span>
          <span
            v-if="group.isPast"
            class="text-[10px] font-bold px-[6px] py-[1px] rounded-full bg-red-500/15 text-red-400"
          >Overdue</span>
        </h2>
        <ul class="flex flex-col gap-2" :aria-label="`Items due ${group.heading}`">
          <li v-for="item in group.items" :key="item.id">
            <button
              class="w-full text-left bg-app-card border border-app-border rounded-xl py-3 px-4 hover:border-app-accent/40 hover:shadow-md transition-all duration-150 focus:outline-2 focus:outline-black"
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
  for (const item of store.itemsWithDueDate) {
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
