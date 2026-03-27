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
        class="bg-app-card border border-app-border rounded-xl p-6 w-[320px] shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
        @keydown.tab.prevent="trap"
        @keydown.esc="respond(false)"
      >
        <p id="confirm-message" class="text-sm leading-relaxed text-app-text mb-5">{{ pending.message }}</p>
        <div class="flex justify-end gap-2">
          <button
            ref="cancelBtn"
            class="bg-transparent border border-app-border rounded-lg py-[7px] px-[14px] text-[13px] cursor-pointer text-app-muted hover:border-app-muted hover:text-app-text"
            @click="respond(false)"
          >Cancel</button>
          <button
            class="btn-delete bg-red-500 text-white border-none rounded-lg py-[7px] px-[14px] text-[13px] font-semibold cursor-pointer"
            @click="respond(true)"
          >{{ pending.confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { pending, respond } = useConfirm()
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
.btn-delete:hover { filter: brightness(1.1); }
</style>
