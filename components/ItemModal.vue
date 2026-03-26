<template>
  <Teleport to="body">
    <div v-if="modal.state.value" class="modal-overlay" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <input
            v-model="title"
            class="modal-title-input"
            placeholder="Item title..."
            @keydown.esc="close"
          />
          <button class="modal-close" @click="close">×</button>
        </div>

        <!-- WYSIWYG toolbar -->
        <div class="editor-toolbar" v-if="editor">
          <button
            v-for="btn in toolbarButtons"
            :key="btn.label"
            class="toolbar-btn"
            :class="{ active: btn.active() }"
            @click="btn.action()"
            :title="btn.label"
          >{{ btn.icon }}</button>
        </div>

        <!-- Editor -->
        <div class="editor-wrapper">
          <EditorContent :editor="editor" class="editor-content" />
        </div>

        <!-- Tags -->
        <div class="modal-tags-section">
          <div class="modal-tags-label">Tags</div>
          <div class="modal-tags-row">
            <TagBadge
              v-for="tagId in selectedTags"
              :key="tagId"
              :tag="store.tags.find(t => t.id === tagId)!"
              removable
              @remove="toggleTag(tagId)"
            />
            <div class="tag-picker-wrap">
              <button class="btn-add-tag" @click.stop="showTagPicker = !showTagPicker">+ tag</button>
              <div v-if="showTagPicker" class="tag-dropdown">
                <div class="tag-dropdown-inner">
                  <div
                    v-for="tag in usedTags"
                    :key="tag.id"
                    class="tag-option"
                    :class="{ active: selectedTags.includes(tag.id) }"
                    @click="toggleTag(tag.id)"
                  >
                    <TagBadge :tag="tag" />
                    <span class="tag-check" v-if="selectedTags.includes(tag.id)">✓</span>
                  </div>
                  <div class="tag-create" v-if="newTagLabel.trim()">
                    <button class="btn-create-tag" @click="createAndAssign">Create "{{ newTagLabel }}"</button>
                  </div>
                  <input
                    ref="tagInput"
                    v-model="newTagLabel"
                    placeholder="New tag..."
                    class="tag-input"
                    @keydown.enter="createAndAssign"
                    @keydown.esc="showTagPicker = false"
                    @click.stop
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="close">Cancel</button>
          <button class="btn-save" @click="save" :disabled="!title.trim()">
            {{ isNew ? 'Add Item' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { useKanbanStore } from '~/stores/kanban'

const modal = useItemModal()
const store = useKanbanStore()

const usedTags = computed(() => {
  const usedIds = new Set(store.boards.flatMap(b => b.items.flatMap(i => i.tags)))
  return store.tags.filter(t => usedIds.has(t.id) || selectedTags.value.includes(t.id))
})

const title = ref('')
const selectedTags = ref<string[]>([])
const showTagPicker = ref(false)
const newTagLabel = ref('')
const tagInput = ref<HTMLInputElement | null>(null)

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
  } else {
    title.value = ''
    selectedTags.value = []
    editor.value?.commands.setContent('')
  }
  showTagPicker.value = false
  newTagLabel.value = ''
}, { immediate: true })

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
  const description = editor.value?.getHTML() ?? ''

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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  width: 560px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid var(--border);
}
.modal-title-input {
  flex: 1;
  background: none;
  border: none;
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  outline: none;
}
.modal-title-input::placeholder { color: var(--text-muted); font-weight: 400; }
.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}
.modal-close:hover { color: var(--text); }

/* Toolbar */
.editor-toolbar {
  display: flex;
  gap: 2px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.toolbar-btn {
  background: none;
  border: 1px solid transparent;
  border-radius: 5px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 3px 8px;
  min-width: 28px;
  text-align: center;
  transition: background 0.1s, color 0.1s;
}
.toolbar-btn:hover { background: var(--hover-bg); color: var(--text); }
.toolbar-btn.active { background: var(--hover-bg); color: var(--accent); border-color: var(--border); }

/* Editor */
.editor-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
  min-height: 140px;
  max-height: 280px;
}

/* Tags section */
.modal-tags-section {
  padding: 10px 18px 14px;
  border-top: 1px solid var(--border);
}
.modal-tags-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
.modal-tags-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.tag-picker-wrap {
  position: relative;
}
.btn-add-tag {
  background: none;
  border: 1px dashed var(--border);
  border-radius: 999px;
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 8px;
  cursor: pointer;
  transition: border-color 0.1s, color 0.1s;
}
.btn-add-tag:hover { border-color: var(--accent); color: var(--accent); }
.tag-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 300;
  width: 200px;
}
.tag-dropdown-inner {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.tag-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
}
.tag-option:hover { background: var(--hover-bg); }
.tag-option.active { background: var(--hover-bg); }
.tag-check { color: var(--accent); font-weight: bold; font-size: 11px; }
.tag-input {
  width: 100%;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 12px;
  color: var(--text);
  margin-top: 4px;
  box-sizing: border-box;
}
.tag-input:focus { outline: none; border-color: var(--accent); }
.btn-create-tag {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.btn-create-tag:hover { filter: brightness(1.1); }

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid var(--border);
}
.btn-cancel {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-muted);
}
.btn-cancel:hover { border-color: var(--text-muted); color: var(--text); }
.btn-save {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-save:hover { filter: brightness(1.1); }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
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
