<template>
  <div class="min-h-screen flex flex-col bg-app-bg">
    <!-- Skip to main content -->
    <a href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-app-card focus:text-app-text focus:px-4 focus:py-2 focus:rounded-lg focus:outline-2 focus:outline-black">Skip
      to content</a>

    <!-- Header -->
    <header
      class="flex items-center justify-between py-[14px] px-6 border-b border-app-border bg-app-header sticky top-0 z-10">
      <h1 class="text-[17px] font-extrabold tracking-tight text-app-text">Todo</h1>
      <div class="flex items-center gap-3">
        <div role="group" aria-label="View" class="flex rounded-lg border border-app-border overflow-hidden">
          <button
            class="py-[6px] px-3 text-[12px] font-semibold transition-colors duration-150 focus:outline-2 focus:outline-black"
            :class="activeView === 'kanban' ? 'bg-app-accent text-white' : 'bg-transparent text-app-muted hover:text-app-text hover:bg-app-hover'"
            :aria-pressed="activeView === 'kanban'" @click="setView('kanban')">Kanban</button>
          <button
            class="py-[6px] px-3 text-[12px] font-semibold transition-colors duration-150 focus:outline-2 focus:outline-black border-l border-app-border"
            :class="activeView === 'calendar' ? 'bg-app-accent text-white' : 'bg-transparent text-app-muted hover:text-app-text hover:bg-app-hover'"
            :aria-pressed="activeView === 'calendar'" @click="setView('calendar')">Calendar</button>
        </div>
        <UserMenu />
      </div>
    </header>


    <!-- Tag filter bar -->
    <nav aria-label="Filter by tag"
      class="flex items-center gap-3 py-[10px] px-6 border-b border-app-border bg-app-header flex-wrap"
      v-if="activeView === 'kanban' && usedTags.length > 0">
      <span class="text-xs font-semibold text-app-muted whitespace-nowrap">Filter:</span>
      <div class="flex flex-wrap gap-2">
        <span v-for="tag in usedTags" :key="tag.id"
          class="inline-flex items-center gap-[4px] py-[5px] px-[12px] rounded-full text-[12px] font-semibold tracking-[0.02em] whitespace-nowrap text-white cursor-pointer select-none transition duration-150 tag-filter-item focus:outline-2 focus:outline-black"
          :class="{ 'opacity-[0.35] grayscale-[0.4]': store.filterTags.length > 0 && !store.filterTags.includes(tag.id) }"
          :style="{ backgroundColor: tag.color }" tabindex="0" @click="store.toggleFilterTag(tag.id)"
          @keydown.enter.prevent="store.toggleFilterTag(tag.id)"
          @keydown.space.prevent="store.toggleFilterTag(tag.id)">{{ tag.label }}</span>
      </div>
    </nav>

    <!-- Boards (Kanban view) -->
    <main v-if="activeView === 'kanban'" id="main-content" class="flex-1 p-6 overflow-hidden flex flex-col"
      @dragover.prevent="onBoardAreaDragOver" @drop="onBoardAreaDrop">

      <!-- Carousel -->
      <div class="flex flex-col gap-3">

        <!-- Navigation bar (only when total cards incl. ghost exceed visible slots) -->
        <div v-if="store.boards.length + 1 > visibleCount" class="flex items-center justify-between">
          <button
            class="w-8 h-8 flex items-center justify-center rounded-full bg-app-card border border-app-border text-app-text hover:bg-app-hover transition-colors focus:outline-2 focus:outline-black disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="!canGoPrev"
            aria-label="Show previous boards"
            @click="prevCarousel"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div class="flex gap-[6px]" role="group" aria-label="Board navigation">
            <button
              v-for="n in store.boards.length"
              :key="n"
              class="w-2 h-2 rounded-full transition-colors duration-150 focus:outline-2 focus:outline-black"
              :class="(n - 1) >= carouselOffset && (n - 1) < carouselOffset + visibleCount
                ? 'bg-app-accent'
                : 'bg-app-border hover:bg-app-muted'"
              :aria-label="`Go to board ${n}`"
              @click="jumpToBoard(n - 1)"
            />
          </div>

          <button
            class="w-8 h-8 flex items-center justify-center rounded-full bg-app-card border border-app-border text-app-text hover:bg-app-hover transition-colors focus:outline-2 focus:outline-black disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="!canGoNext"
            aria-label="Show next boards"
            @click="nextCarousel"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <!-- Viewport -->
        <div ref="carouselEl" class="overflow-hidden" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
          <div class="flex items-start" :style="trackStyle">
            <div
              v-for="(board, index) in store.boards"
              :key="board.id"
              class="flex-shrink-0"
              :style="{ width: boardWidth + 'px' }"
            >
              <KanbanBoard
                :board="board"
                :board-index="index"
                :auto-focus-title="board.id === newBoardId"
                @remove="store.removeBoard"
                @board-drag-start="onBoardDragStart"
                @board-drop="onBoardDrop"
              />
            </div>
            <!-- Add board ghost card -->
            <div class="flex-shrink-0" :style="{ width: boardWidth + 'px' }">
              <button
                class="w-full min-h-[120px] flex flex-col items-center justify-center gap-2 bg-transparent border border-dashed border-app-border rounded-xl text-app-muted text-[13px] font-medium cursor-pointer transition-[border-color,color,background] duration-150 hover:border-app-accent hover:text-app-accent hover:bg-app-hover focus:outline-2 focus:outline-black"
                aria-label="Create new board"
                @click="addBoard"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create board
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Calendar view -->
    <CalendarView v-else />
  </div>
</template>

<script setup lang="ts">
import { useKanbanStore } from '~/stores/kanban'

const store = useKanbanStore()
const route = useRoute()
const router = useRouter()

const activeView = computed(() => route.query.view === 'calendar' ? 'calendar' : 'kanban')

function setView(view: 'kanban' | 'calendar') {
  router.replace({ query: { ...route.query, view: view === 'kanban' ? undefined : view } })
}

const usedTags = computed(() => {
  const usedIds = new Set(store.boards.flatMap(b => b.items.flatMap(i => i.tags)))
  return store.tags.filter(t => usedIds.has(t.id))
})

// Add board
const newBoardId = ref<string | null>(null)

function addBoard() {
  store.addBoard('New board').then(id => {
    newBoardId.value = id
    setTimeout(() => { newBoardId.value = null }, 500)
  })
}

// Board drag + drop reorder
const draggingBoardIndex = ref<number | null>(null)

function onBoardDragStart(index: number) {
  draggingBoardIndex.value = index
}

function onBoardAreaDragOver(e: DragEvent) {
  e.preventDefault()
}

function onBoardAreaDrop(e: DragEvent) {
  const raw = e.dataTransfer?.getData('text/plain')
  if (!raw) return
  try {
    const data = JSON.parse(raw)
    if (data.boardDrag) {
      const target = (e.target as HTMLElement).closest('.kanban-board')
      if (!target) return
      const boards = document.querySelectorAll('.kanban-board')
      const toIndex = Array.from(boards).indexOf(target as Element)
      if (toIndex !== -1 && toIndex !== data.index) {
        store.moveBoard(data.index, toIndex)
      }
    }
  } catch { }
  draggingBoardIndex.value = null
}

function onBoardDrop(_toIndex: number) { }

// Carousel
const carouselEl = ref<HTMLElement | null>(null)
const carouselWidth = ref(1280)
const windowWidth = ref(1280)
const carouselOffset = ref(0)
const GAP = 16

function getVisibleCount(w: number) {
  if (w < 640) return 1
  if (w < 1024) return 2
  if (w < 1280) return 3
  return 4
}

const visibleCount = computed(() => getVisibleCount(windowWidth.value))
const boardWidth = computed(() => (carouselWidth.value - GAP * (visibleCount.value - 1)) / visibleCount.value)
const trackStyle = computed(() => ({
  gap: `${GAP}px`,
  transform: `translateX(${-(carouselOffset.value * (boardWidth.value + GAP))}px)`,
  transition: 'transform 300ms ease-in-out',
}))

const totalCards = computed(() => store.boards.length + 1) // boards + ghost add card
const canGoPrev = computed(() => carouselOffset.value > 0)
const canGoNext = computed(() => carouselOffset.value + visibleCount.value < totalCards.value)

function prevCarousel() {
  carouselOffset.value = Math.max(0, carouselOffset.value - 1)
}
function nextCarousel() {
  carouselOffset.value = Math.min(totalCards.value - visibleCount.value, carouselOffset.value + 1)
}
function jumpToBoard(index: number) {
  carouselOffset.value = Math.max(0, Math.min(index, totalCards.value - visibleCount.value))
}

// Touch swipe
let touchStartX = 0
let touchStartY = 0
function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
    if (dx < 0) nextCarousel()
    else prevCarousel()
  }
}

watch([totalCards, visibleCount], () => {
  const maxOffset = Math.max(0, totalCards.value - visibleCount.value)
  if (carouselOffset.value > maxOffset) carouselOffset.value = maxOffset
})

onMounted(() => {
  windowWidth.value = window.innerWidth
  if (carouselEl.value) carouselWidth.value = carouselEl.value.clientWidth
  const onResize = () => {
    windowWidth.value = window.innerWidth
    if (carouselEl.value) carouselWidth.value = carouselEl.value.clientWidth
  }
  window.addEventListener('resize', onResize)
  onUnmounted(() => window.removeEventListener('resize', onResize))
})
</script>

<style scoped>
.tag-filter-item:hover {
  filter: brightness(1.15);
}
</style>
