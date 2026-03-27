<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div v-if="modal.state.value" class="fixed inset-0 bg-black/[0.45] z-[200]" @click.self="close" />
    </Transition>
    <Transition name="sidebar">
      <div
        v-if="modal.state.value"
        ref="dialogEl"
        role="dialog"
        aria-modal="true"
        :aria-label="isNew ? 'New item' : 'Edit item'"
        class="fixed top-0 right-0 bottom-0 w-[480px] max-w-full bg-app-card border-l border-app-border flex flex-col z-[201] shadow-[-24px_0_64px_rgba(0,0,0,0.25)]"
        @keydown.tab="trap"
      >

        <!-- Header -->
        <div class="flex items-center gap-2 px-[18px] pt-[18px] pb-3 border-b border-app-border">
          <input
            ref="titleInput"
            v-model="title"
            aria-label="Item title"
            class="flex-1 bg-transparent border-none text-[17px] font-bold text-app-text outline-none placeholder:text-app-muted placeholder:font-normal"
            placeholder="Item title..."
            @keydown.esc="close"
          />
          <button aria-label="Close" class="modal-close bg-transparent border-none text-app-muted text-[22px] cursor-pointer leading-none px-1 hover:text-app-text" @click="close">×</button>
        </div>

        <!-- WYSIWYG toolbar -->
        <div class="flex gap-[2px] px-3 py-[6px] border-b border-app-border flex-wrap" v-if="editor">
          <button
            v-for="btn in toolbarButtons"
            :key="btn.label"
            class="toolbar-btn bg-transparent border border-transparent rounded-[5px] text-app-muted text-xs font-bold cursor-pointer py-[3px] px-2 min-w-[28px] text-center transition-[background,color] duration-100 hover:bg-app-hover hover:text-app-text"
            :class="{ 'bg-app-hover text-app-accent border-app-border': btn.active() }"
            @click="btn.action()"
            :aria-label="btn.label"
            :aria-pressed="btn.active()"
          >{{ btn.icon }}</button>
        </div>

        <!-- Scrollable body: editor + comments + tags -->
        <div class="flex-1 overflow-y-auto">

        <!-- Editor -->
        <div class="px-[18px] py-[14px]">
          <EditorContent :editor="editor" class="editor-content" />
        </div>

        <!-- Tags -->
        <div class="px-[18px] pt-[10px] pb-[14px] border-t border-app-border">
          <div class="text-[11px] font-semibold text-app-muted uppercase tracking-[0.06em] mb-2">Tags</div>
          <div class="flex flex-wrap items-center gap-[6px]">
            <TagBadge
              v-for="tagId in selectedTags"
              :key="tagId"
              :tag="store.tags.find(t => t.id === tagId)!"
              removable
              @remove="toggleTag(tagId)"
            />
            <div class="relative" ref="tagPickerRef">
              <button ref="addTagBtn" class="btn-add-tag bg-transparent border border-dashed border-app-border rounded-full text-[11px] text-app-muted py-[2px] px-2 cursor-pointer transition-[border-color,color] duration-100 hover:border-app-accent hover:text-app-accent" @click="showTagPicker = !showTagPicker">+ tag</button>
              <div v-if="showTagPicker" class="absolute top-[calc(100%+4px)] left-0 z-[300] w-[200px]" @focusout="onTagPickerFocusOut" @keydown.esc.stop="closeTagPicker">
                <div class="bg-app-card border border-app-border rounded-lg p-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.3)] flex flex-col gap-[3px]">
                  <button
                    v-for="tag in usedTags"
                    :key="tag.id"
                    type="button"
                    class="flex items-center justify-between px-[6px] py-1 rounded cursor-pointer bg-transparent border-none w-full text-left hover:bg-app-hover focus:outline-2 focus:outline-black"
                    :class="{ 'bg-app-hover': selectedTags.includes(tag.id) }"
                    @click="toggleTag(tag.id)"
                  >
                    <TagBadge :tag="tag" />
                    <span v-if="selectedTags.includes(tag.id)" class="text-app-accent font-bold text-[11px]">✓</span>
                  </button>
                  <button v-if="newTagLabel.trim()" type="button" class="btn-create-tag bg-app-accent text-white border-none rounded text-[11px] cursor-pointer py-1 px-2 w-full text-left focus:outline-2 focus:outline-black" @click="createAndAssign">Create "{{ newTagLabel }}"</button>
                  <input
                    ref="tagInput"
                    v-model="newTagLabel"
                    placeholder="New tag..."
                    class="w-full bg-app-input border border-app-border rounded text-xs text-app-text py-[5px] px-2 mt-1 outline-none focus:border-app-accent box-border"
                    @keydown.enter="createAndAssign"
                    @click.stop
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div class="px-[18px] pt-[10px] pb-[14px] border-t border-app-border flex flex-col gap-3" v-if="!isNew">
          <div class="text-[11px] font-semibold text-app-muted uppercase tracking-[0.06em]">Comments</div>

          <!-- Comment list -->
          <div class="flex flex-col gap-3" v-if="comments.length > 0">
            <div v-for="comment in comments" :key="comment.id" class="flex gap-[10px] group">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-[1px]"
                :style="{ backgroundColor: authorColor(comment.author.email) }"
              >{{ comment.author.name?.[0]?.toUpperCase() ?? '?' }}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="text-[12px] font-semibold text-app-text">{{ comment.author.name }}</span>
                  <span class="text-[11px] text-app-muted">{{ formatTime(comment.createdAt) }}</span>
                  <button
                    v-if="comment.isOwn"
                    class="text-[11px] text-app-muted opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 focus:opacity-100 focus:text-red-500 focus:outline-2 focus:outline-black ml-auto"
                    @click="deleteComment(comment.id)"
                  >Delete</button>
                </div>
                <p class="text-[13px] text-app-text leading-relaxed mt-[2px] whitespace-pre-wrap break-words">{{ comment.body }}</p>
              </div>
            </div>
          </div>
          <p v-else class="text-[12px] text-app-muted">No comments yet.</p>

          <!-- New comment input -->
          <div class="flex gap-2 items-end">
            <textarea
              v-model="newComment"
              placeholder="Add a comment..."
              aria-label="Add a comment"
              rows="2"
              class="flex-1 bg-app-input border border-app-border rounded-lg py-[8px] px-3 text-[13px] text-app-text outline-none resize-none transition-colors duration-150 focus:border-app-accent placeholder:text-app-muted"
              @keydown.enter.exact.prevent="submitComment"
            />
            <button
              class="btn-comment bg-app-accent text-white border-none rounded-lg py-[8px] px-3 text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              :disabled="!newComment.trim()"
              @click="submitComment"
            >Post</button>
          </div>
        </div>

        </div><!-- end scrollable body -->

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-[18px] py-3 border-t border-app-border">
          <button class="btn-cancel bg-transparent border border-app-border rounded-lg py-[7px] px-[14px] text-[13px] cursor-pointer text-app-muted hover:border-app-muted hover:text-app-text" @click="close">Cancel</button>
          <button class="btn-save bg-app-accent text-white border-none rounded-lg py-[7px] px-[18px] text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" @click="save" :disabled="!title.trim()">
            {{ isNew ? 'Add Item' : 'Save' }}
          </button>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { useKanbanStore } from '~/stores/kanban'

const modal = useItemModal()
const store = useKanbanStore()
const { trapFocus } = useFocusTrap()

const dialogEl = ref<HTMLElement | null>(null)

function trap(e: KeyboardEvent) {
  if (dialogEl.value) trapFocus(e, dialogEl.value)
}

const usedTags = computed(() => {
  const usedIds = new Set(store.boards.flatMap(b => b.items.flatMap(i => i.tags)))
  return store.tags.filter(t => usedIds.has(t.id) || selectedTags.value.includes(t.id))
})

const title = ref('')
const selectedTags = ref<string[]>([])
const showTagPicker = ref(false)
const newTagLabel = ref('')
const titleInput = ref<HTMLInputElement | null>(null)
const tagInput = ref<HTMLInputElement | null>(null)
const tagPickerRef = ref<HTMLElement | null>(null)
const addTagBtn = ref<HTMLButtonElement | null>(null)

function closeTagPicker() {
  showTagPicker.value = false
  nextTick(() => addTagBtn.value?.focus())
}

function onTagPickerClickOutside(e: MouseEvent) {
  if (tagPickerRef.value && !tagPickerRef.value.contains(e.target as Node)) {
    showTagPicker.value = false
  }
}

function onTagPickerFocusOut(e: FocusEvent) {
  // Close if focus moves outside the entire tag picker ref container
  if (tagPickerRef.value && !tagPickerRef.value.contains(e.relatedTarget as Node)) {
    showTagPicker.value = false
  }
}

watch(showTagPicker, (val) => {
  if (val) document.addEventListener('mousedown', onTagPickerClickOutside)
  else document.removeEventListener('mousedown', onTagPickerClickOutside)
})

onUnmounted(() => document.removeEventListener('mousedown', onTagPickerClickOutside))

const isNew = computed(() => modal.state.value?.itemId === null)

// Sync form state when modal opens
watch(() => modal.state.value, (val) => {
  if (!val) return
  if (val.itemId) {
    const board = store.boards.find(b => b.id === val.boardId)
    const item = board?.items.find(i => i.id === val.itemId)
    if (item) {
      title.value = item.title
      selectedTags.value = [...item.tags]
      editor.value?.commands.setContent(item.description || '')
    }
    loadComments(val.itemId)
  } else {
    title.value = ''
    selectedTags.value = []
    editor.value?.commands.setContent('')
    comments.value = []
  }
  showTagPicker.value = false
  newTagLabel.value = ''
  nextTick(() => titleInput.value?.focus())
}, { immediate: true })

// Comments
interface Comment {
  id: string
  body: string
  createdAt: string
  isOwn: boolean
  author: { name: string; email: string }
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']
function authorColor(email: string) {
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const comments = ref<Comment[]>([])
const newComment = ref('')

async function loadComments(itemId: string) {
  comments.value = await $fetch<Comment[]>(`/api/items/${itemId}/comments`)
}

async function submitComment() {
  const body = newComment.value.trim()
  if (!body || !modal.state.value?.itemId) return
  const id = Math.random().toString(36).slice(2, 10)
  const comment = await $fetch<Comment>(`/api/items/${modal.state.value.itemId}/comments`, {
    method: 'POST',
    body: { id, body },
  })
  comments.value.push(comment)
  newComment.value = ''
}

async function deleteComment(commentId: string) {
  if (!modal.state.value?.itemId) return
  await $fetch(`/api/items/${modal.state.value.itemId}/comments/${commentId}`, { method: 'DELETE' })
  comments.value = comments.value.filter(c => c.id !== commentId)
}

const editor = useEditor({
  extensions: [StarterKit],
  content: '',
  editorProps: {
    attributes: { class: 'prose-editor' },
  },
})

onUnmounted(() => editor.value?.destroy())

const toolbarButtons = computed(() => [
  { label: 'Bold',        icon: 'B',  active: () => !!editor.value?.isActive('bold'),        action: () => editor.value?.chain().focus().toggleBold().run() },
  { label: 'Italic',      icon: 'I',  active: () => !!editor.value?.isActive('italic'),       action: () => editor.value?.chain().focus().toggleItalic().run() },
  { label: 'Strike',      icon: 'S',  active: () => !!editor.value?.isActive('strike'),       action: () => editor.value?.chain().focus().toggleStrike().run() },
  { label: 'Code',        icon: '<>', active: () => !!editor.value?.isActive('code'),         action: () => editor.value?.chain().focus().toggleCode().run() },
  { label: 'Bullet list', icon: '≡',  active: () => !!editor.value?.isActive('bulletList'),  action: () => editor.value?.chain().focus().toggleBulletList().run() },
  { label: 'Ordered list',icon: '1.', active: () => !!editor.value?.isActive('orderedList'), action: () => editor.value?.chain().focus().toggleOrderedList().run() },
  { label: 'Blockquote',  icon: '"',  active: () => !!editor.value?.isActive('blockquote'),  action: () => editor.value?.chain().focus().toggleBlockquote().run() },
])

function toggleTag(tagId: string) {
  const i = selectedTags.value.indexOf(tagId)
  if (i === -1) selectedTags.value.push(tagId)
  else selectedTags.value.splice(i, 1)
}

async function createAndAssign() {
  const label = newTagLabel.value.trim()
  if (!label) return
  const tag = await store.addTag(label)
  if (!selectedTags.value.includes(tag.id)) selectedTags.value.push(tag.id)
  newTagLabel.value = ''
}

function save() {
  const t = title.value.trim()
  if (!t) return
  const { boardId, itemId } = modal.state.value!
  const raw = editor.value?.getHTML() ?? ''
  const description = raw.replace(/<[^>]*>/g, '').trim() ? raw : ''

  if (itemId) {
    store.updateItem(boardId, itemId, { title: t, description, tags: selectedTags.value })
  } else {
    store.addItem(boardId, t, description, selectedTags.value)
  }
  close()
}

function close() {
  modal.close()
  showTagPicker.value = false
}
</script>

<style scoped>
.btn-save:hover:not(:disabled) { filter: brightness(1.1); }
.btn-create-tag:hover { filter: brightness(1.1); }
.btn-comment:hover:not(:disabled) { filter: brightness(1.1); }

.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(100%);
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>

<style>
/* Unscoped — Tiptap renders outside scoped context */
.prose-editor {
  color: var(--text);
  font-size: 14px;
  line-height: 1.7;
  outline: none;
  min-height: 100px;
}
.prose-editor p { margin: 0 0 6px; }
.prose-editor p:last-child { margin-bottom: 0; }
.prose-editor strong { color: var(--text); }
.prose-editor em { opacity: 0.85; }
.prose-editor s { opacity: 0.5; }
.prose-editor code {
  background: var(--hover-bg);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 12px;
  font-family: monospace;
}
.prose-editor blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 12px;
  margin: 6px 0;
  opacity: 0.75;
}
.prose-editor ul, .prose-editor ol {
  padding-left: 20px;
  margin: 4px 0;
}
.prose-editor li { margin: 2px 0; }
.prose-editor p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--text-muted);
  pointer-events: none;
  float: left;
  height: 0;
}
</style>
