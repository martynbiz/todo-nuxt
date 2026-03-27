<template>
  <Teleport to="body">
    <div v-if="pending" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]" @click.self="respond(false)">
      <div class="bg-app-card border border-app-border rounded-xl p-6 w-[320px] shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
        <p class="text-sm leading-relaxed text-app-text mb-5">{{ pending.message }}</p>
        <div class="flex justify-end gap-2">
          <button
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
</script>

<style scoped>
.btn-delete:hover { filter: brightness(1.1); }
</style>
