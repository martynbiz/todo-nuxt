<template>
  <Teleport to="body">
    <div v-if="pending" class="confirm-overlay" @click.self="respond(false)">
      <div class="confirm-dialog">
        <p class="confirm-message">{{ pending.message }}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="respond(false)">Cancel</button>
          <button class="btn-delete" @click="respond(true)">{{ pending.confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { pending, respond } = useConfirm()
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.confirm-dialog {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  width: 320px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
}
.confirm-message {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
  margin-bottom: 20px;
}
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-delete:hover { filter: brightness(1.1); }
</style>
