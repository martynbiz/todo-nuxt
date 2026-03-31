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
        <button v-if="activeView === 'kanban'"
          class="btn-add-board inline-flex items-center gap-[6px] bg-app-accent text-white border-none rounded-lg py-[7px] px-[14px] text-[13px] font-semibold cursor-pointer"
          @click="openAddBoard">
          <svg class="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Board
        </button>
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

    <!-- Add board form -->
    <div v-if="showAddBoard" class="flex items-center gap-2 py-3 px-6 bg-app-board border-b border-app-border">
      <input ref="boardInput" v-model="newBoardTitle"
        class="bg-app-input border border-app-accent rounded-lg py-2 px-3 text-sm text-app-text outline-none w-[240px]"
        placeholder="Board name..." @keydown.enter="submitBoard" @keydown.esc="showAddBoard = false" />
      <button
        class="btn-confirm bg-app-accent text-white border-none rounded-lg py-2 px-4 text-[13px] font-semibold cursor-pointer"
        @click="submitBoard">Create</button>
      <button
        class="border border-app-border rounded-lg py-2 px-3 text-[13px] cursor-pointer text-app-muted bg-transparent hover:border-app-muted hover:text-app-text"
        @click="showAddBoard = false; newBoardTitle = ''">Cancel</button>
    </div>

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

      <!-- Empty state -->
      <div v-if="store.boards.length === 0"
        class="flex flex-col items-center justify-center gap-3 text-app-muted text-sm p-16 w-full flex-1">
        <svg class="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="18" rx="2" />
          <rect x="14" y="3" width="7" height="11" rx="2" />
        </svg>
        <p class="text-[15px] font-semibold text-app-text opacity-40">No boards yet</p>
        <p class="text-[13px] opacity-60">Create your first board to get started</p>
      </div>

      <!-- Carousel -->
      <div v-else class="flex flex-col gap-3">

        <!-- Navigation bar (only when there are more boards than visible) -->
        <div v-if="store.boards.length > visibleCount" class="flex items-center justify-between">
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
                @remove="store.removeBoard"
                @board-drag-start="onBoardDragStart"
                @board-drop="onBoardDrop"
              />
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
const showAddBoard = ref(false)
const newBoardTitle = ref('')
const boardInput = ref<HTMLInputElement | null>(null)
let addBoardTriggerEl: HTMLElement | null = null

watch(showAddBoard, (val) => {
  if (val) {
    nextTick(() => boardInput.value?.focus())
  } else {
    addBoardTriggerEl?.focus()
    addBoardTriggerEl = null
  }
})

function openAddBoard() {
  addBoardTriggerEl = document.activeElement as HTMLElement
  showAddBoard.value = true
}

function submitBoard() {
  const t = newBoardTitle.value.trim()
  if (t) {
    store.addBoard(t)
    newBoardTitle.value = ''
    showAddBoard.value = false
  }
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

const canGoPrev = computed(() => carouselOffset.value > 0)
const canGoNext = computed(() => carouselOffset.value + visibleCount.value < store.boards.length)

function prevCarousel() {
  carouselOffset.value = Math.max(0, carouselOffset.value - 1)
}
function nextCarousel() {
  carouselOffset.value = Math.min(store.boards.length - visibleCount.value, carouselOffset.value + 1)
}
function jumpToBoard(index: number) {
  carouselOffset.value = Math.max(0, Math.min(index, store.boards.length - visibleCount.value))
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

watch([() => store.boards.length, visibleCount], () => {
  const maxOffset = Math.max(0, store.boards.length - visibleCount.value)
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
.btn-add-board:hover {
  filter: brightness(1.1);
}

.btn-confirm:hover {
  filter: brightness(1.1);
}

.tag-filter-item:hover {
  filter: brightness(1.15);
}
</style>
