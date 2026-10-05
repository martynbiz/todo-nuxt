<template>
  <div class="item-actions" :class="{ 'is-open': open }">
    <button
      ref="triggerEl"
      type="button"
      class="item-actions-trigger bg-transparent border-none text-app-muted cursor-pointer p-1 rounded-md leading-none transition-[opacity,background,color] duration-100 hover:bg-app-hover hover:text-app-text focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
      :aria-label="`Actions for ${item.title}`"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="open ? menuId : undefined"
      @click.stop="toggle"
      @keydown.down.prevent.stop="openMenu(0)"
      @keydown.up.prevent.stop="openMenu(-1)"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
      </svg>
    </button>

    <Teleport to="body">
      <Transition name="menu">
        <div
          v-if="open"
          :id="menuId"
          ref="menuEl"
          role="menu"
          :aria-label="`Actions for ${item.title}`"
          class="fixed z-[600] min-w-[200px] bg-app-card border border-app-border rounded-xl shadow-overlay p-[6px]"
          :style="menuStyle"
          @keydown.down.prevent="moveFocus(1)"
          @keydown.up.prevent="moveFocus(-1)"
          @keydown.home.prevent="focusAt(0)"
          @keydown.end.prevent="focusAt(-1)"
          @keydown.esc.prevent.stop="close(true)"
          @keydown.tab.prevent="close(true)"
          @click.stop
        >
          <div v-if="boardTitle" class="px-3 pt-1 pb-[6px] text-[11px] font-semibold text-app-muted uppercase tracking-[0.06em] truncate">
            {{ boardTitle }}
          </div>
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            class="menu-item"
            :disabled="isFirst"
            @click="moveToTop"
          >
            <svg class="w-[15px] h-[15px] shrink-0 text-app-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M5 4h14"/><path d="M12 20V9"/><path d="M7 13l5-5 5 5"/>
            </svg>
            Move to top
          </button>
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            class="menu-item"
            :disabled="isLast"
            @click="moveToBottom"
          >
            <svg class="w-[15px] h-[15px] shrink-0 text-app-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M5 20h14"/><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/>
            </svg>
            Move to bottom
          </button>
          <div class="h-px bg-app-border my-1" role="separator" />
          <button
            type="button"
            role="menuitem"
            tabindex="-1"
            class="menu-item menu-item-danger"
            @click="remove"
          >
            <svg class="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Delete
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '~/stores/kanban'
import { useKanbanStore } from '~/stores/kanban'

const props = defineProps<{ item: Item; boardId: string; showBoard?: boolean }>()

const store = useKanbanStore()
const { confirm } = useConfirm()

const menuId = `item-actions-${useId()}`
const open = ref(false)
const triggerEl = ref<HTMLButtonElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const board = computed(() => store.boards.find(b => b.id === props.boardId))
const index = computed(() => board.value?.items.findIndex(i => i.id === props.item.id) ?? -1)
const isFirst = computed(() => index.value === 0)
const isLast = computed(() => !!board.value && index.value === board.value.items.length - 1)
const boardTitle = computed(() => props.showBoard ? board.value?.title : undefined)

// ─── Open / close ────────────────────────────────────────────────────────────

function position() {
  const rect = triggerEl.value?.getBoundingClientRect()
  if (!rect) return
  const MENU_W = 200
  const MENU_H = menuEl.value?.offsetHeight ?? 160
  const left = Math.max(8, Math.min(rect.right - MENU_W, window.innerWidth - MENU_W - 8))
  const below = rect.bottom + 6
  const top = below + MENU_H > window.innerHeight - 8 ? Math.max(8, rect.top - MENU_H - 6) : below
  menuStyle.value = { top: `${top}px`, left: `${left}px` }
}

function items() {
  return Array.from(menuEl.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])
}

function focusAt(i: number) {
  const list = items()
  if (!list.length) return
  list[(i + list.length) % list.length].focus()
}

function moveFocus(delta: number) {
  const list = items()
  const current = list.indexOf(document.activeElement as HTMLButtonElement)
  focusAt(current === -1 ? (delta > 0 ? 0 : -1) : current + delta)
}

async function openMenu(focusIndex = 0) {
  open.value = true
  position()
  await nextTick()
  position() // re-run now the real menu height is known
  focusAt(focusIndex)
}

function close(returnFocus: boolean) {
  if (!open.value) return
  open.value = false
  if (returnFocus) triggerEl.value?.focus()
}

function toggle() {
  if (open.value) close(true)
  else openMenu(0)
}

function onDocPointerDown(e: PointerEvent) {
  const t = e.target as Node
  if (menuEl.value?.contains(t) || triggerEl.value?.contains(t)) return
  close(false)
}
function onViewportChange() { close(false) }

watch(open, (val) => {
  if (val) {
    document.addEventListener('pointerdown', onDocPointerDown, true)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
  } else {
    document.removeEventListener('pointerdown', onDocPointerDown, true)
    window.removeEventListener('scroll', onViewportChange, true)
    window.removeEventListener('resize', onViewportChange)
  }
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
})

// ─── Actions ─────────────────────────────────────────────────────────────────

function moveToTop() {
  close(true)
  if (index.value > 0) store.moveItem(props.boardId, index.value, props.boardId, 0)
}

function moveToBottom() {
  close(true)
  const b = board.value
  if (b && index.value !== -1 && index.value < b.items.length - 1) {
    store.moveItem(props.boardId, index.value, props.boardId, b.items.length - 1)
  }
}

async function remove() {
  // Return focus to the trigger first so useConfirm restores focus to a live element
  close(true)
  const ok = await confirm({ message: `Delete "${props.item.title}"?` })
  if (ok) store.removeItem(props.boardId, props.item.id)
}
</script>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}
.menu-item:hover:not(:disabled),
.menu-item:focus-visible { background: var(--hover-bg); outline: none; }
.menu-item:focus-visible { box-shadow: inset 0 0 0 2px var(--accent); }
.menu-item:disabled { opacity: 0.45; cursor: not-allowed; }
.menu-item-danger { color: var(--danger); }

.menu-enter-active, .menu-leave-active { transition: opacity 0.12s, transform 0.12s; }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
