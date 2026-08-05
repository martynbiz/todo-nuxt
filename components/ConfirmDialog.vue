<template>
  <Teleport to="body">
    <div
      v-if="pending"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]"
      @click.self="respond(false)"
    >
      <div
        ref="dialogEl"
        role="alertdialog"
        aria-modal="true"
        aria-describedby="confirm-message"
        class="bg-app-card border border-app-border rounded-xl p-6 w-[320px] shadow-brutal-lg"
        @keydown.tab.prevent="trap"
        @keydown.esc="respond(false)"
      >
        <p id="confirm-message" class="text-sm leading-relaxed text-app-text mb-5">{{ pending.message }}</p>
        <label
          v-if="pending.checkbox"
          class="flex items-center gap-2 text-sm text-app-text mb-5 cursor-pointer select-none"
        >
          <input
            type="checkbox"
            v-model="checked"
            class="w-4 h-4 accent-[var(--accent)] focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
          />
          {{ pending.checkbox.label }}
        </label>
        <div class="flex justify-end gap-2">
          <button
            ref="cancelBtn"
            class="bg-app-card border-2 border-app-border rounded-lg py-[7px] px-[14px] text-[13px] cursor-pointer text-app-text hover:bg-app-hover focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
            @click="respond(false)"
          >Cancel</button>
          <button
            class="btn-delete bg-app-text text-app-bg border-2 border-app-border shadow-brutal-sm rounded-lg py-[7px] px-[14px] text-[13px] font-semibold cursor-pointer focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
            @click="respond(true)"
          >{{ pending.confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { pending, respond, checked } = useConfirm()
const { trapFocus } = useFocusTrap()

const dialogEl = ref<HTMLElement | null>(null)
const cancelBtn = ref<HTMLButtonElement | null>(null)

watch(pending, (val) => {
  if (val) nextTick(() => cancelBtn.value?.focus())
})

function trap(e: KeyboardEvent) {
  if (dialogEl.value) trapFocus(e, dialogEl.value)
}
</script>

<style scoped>
.btn-delete:hover { transform: translate(1px, 1px); box-shadow: none; }
</style>
