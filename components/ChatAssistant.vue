<template>
  <!-- Create item button (shown only when boards exist) -->
  <button
    v-if="store.boards.length > 0"
    class="fixed bottom-[88px] right-6 z-[400] w-14 h-14 rounded-full flex items-center justify-center shadow-lg border border-gray-200 bg-white text-slate-800 transition-all duration-200 hover:shadow-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
    aria-label="Create new item"
    @click="modal.openNew()"
  >
    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>

  <!-- Floating trigger button -->
  <button
    class="fixed bottom-6 right-6 z-[400] w-14 h-14 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
    :class="isOpen
      ? 'bg-slate-900 border-slate-900 text-white'
      : 'bg-white border-gray-200 text-slate-800'"
    :aria-label="isOpen ? 'Close AI assistant' : 'Open AI assistant'"
    :aria-expanded="isOpen"
    aria-controls="chat-assistant-panel"
    @click="toggleOpen"
  >
    <!-- Chat icon -->
    <svg v-if="!isOpen" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <!-- Close icon -->
    <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>

  <!-- Chat panel -->
  <Transition name="chat-panel">
    <div
      v-if="isOpen"
      id="chat-assistant-panel"
      ref="panelEl"
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant"
      class="fixed bottom-[88px] right-6 z-[400] w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
      style="height: 500px"
      @keydown.tab="trap"
      @keydown.esc="isOpen = false"
    >
      <!-- Header -->
      <div class="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white shrink-0">
        <svg class="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="text-[14px] font-semibold flex-1">AI Assistant</span>
        <button
          class="text-white/60 hover:text-white focus:outline-none focus:ring-1 focus:ring-white rounded px-1"
          aria-label="Close AI assistant"
          @click="isOpen = false"
        >×</button>
      </div>

      <!-- Message list -->
      <div ref="messagesEl" class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        <!-- Welcome -->
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
          <svg class="w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p class="text-[13px] text-center leading-relaxed text-gray-500">
            Ask me to organise your tasks.<br/>
            <span class="text-gray-400 text-[12px]">e.g. "Move all DIY items to the top of Backlog"</span>
          </p>
        </div>

        <!-- Messages -->
        <template v-for="(msg, i) in messages" :key="i">
          <!-- User -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="bg-slate-900 text-white text-[13px] rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] leading-relaxed">
              {{ msg.content }}
            </div>
          </div>
          <!-- Assistant -->
          <div v-else class="flex justify-start">
            <div class="bg-gray-100 text-gray-800 text-[13px] rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%] leading-relaxed">
              {{ msg.content }}
              <span v-if="msg.actionsApplied && msg.actionsApplied > 0" class="block mt-1 text-[11px] text-gray-400">
                {{ msg.actionsApplied }} change{{ msg.actionsApplied !== 1 ? 's' : '' }} applied
              </span>
            </div>
          </div>
        </template>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-start">
          <div class="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
            <span class="flex gap-1 items-center" aria-label="Thinking">
              <span class="w-[6px] h-[6px] rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0ms"/>
              <span class="w-[6px] h-[6px] rounded-full bg-gray-400 animate-bounce" style="animation-delay: 150ms"/>
              <span class="w-[6px] h-[6px] rounded-full bg-gray-400 animate-bounce" style="animation-delay: 300ms"/>
            </span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="shrink-0 border-t border-gray-200 px-3 py-3 flex gap-2">
        <textarea
          ref="inputEl"
          v-model="prompt"
          placeholder="Ask me anything..."
          aria-label="Message to AI assistant"
          rows="1"
          class="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-[13px] text-gray-800 outline-none resize-none transition-colors focus:border-slate-400 placeholder:text-gray-400 leading-relaxed"
          style="max-height: 80px; min-height: 38px"
          :disabled="loading"
          @keydown.enter.exact.prevent="send"
          @input="autoResize"
        />
        <button
          class="shrink-0 bg-slate-900 text-white rounded-xl px-3 py-2 text-[13px] font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
          :disabled="loading || !prompt.trim()"
          aria-label="Send message"
          @click="send"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useKanbanStore } from '~/stores/kanban'

const store = useKanbanStore()
const modal = useItemModal()
const { trapFocus } = useFocusTrap()

const isOpen = ref(false)
const loading = ref(false)
const prompt = ref('')
const panelEl = ref<HTMLElement | null>(null)
const messagesEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  actionsApplied?: number
}
const messages = ref<ChatMessage[]>([])

function trap(e: KeyboardEvent) {
  if (panelEl.value) trapFocus(e, panelEl.value)
}

function toggleOpen() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => inputEl.value?.focus())
  }
}

watch(isOpen, (val) => {
  if (val) nextTick(() => inputEl.value?.focus())
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 80) + 'px'
}

async function send() {
  const text = prompt.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  prompt.value = ''
  if (inputEl.value) { inputEl.value.style.height = 'auto' }
  loading.value = true
  scrollToBottom()

  try {
    const history = messages.value.slice(0, -1).map((m: ChatMessage) => ({ role: m.role, content: m.content }))

    const result = await $fetch<{ message: string; actionsApplied: number }>('/api/chat', {
      method: 'POST',
      body: { prompt: text, history },
    })

    messages.value.push({
      role: 'assistant',
      content: result.message,
      actionsApplied: result.actionsApplied,
    })

    // Refresh kanban state if changes were applied
    if (result.actionsApplied > 0) {
      await store.init()
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
    messages.value.push({ role: 'assistant', content: msg })
  } finally {
    loading.value = false
    scrollToBottom()
    nextTick(() => inputEl.value?.focus())
  }
}
</script>

<style scoped>
.chat-panel-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chat-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
</style>
