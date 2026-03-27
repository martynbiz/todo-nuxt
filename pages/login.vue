<template>
  <div class="min-h-screen flex items-center justify-center bg-app-bg px-6 py-6">
    <div class="bg-app-board border border-app-border rounded-2xl p-9 w-full max-w-sm shadow-[0_16px_48px_rgba(0,0,0,0.3)] flex flex-col items-center gap-7">
      <h1 class="text-xl font-extrabold text-app-text text-center tracking-tight">Kanban Board</h1>

      <p v-if="error" class="text-[13px] text-red-500 text-center">Sign-in failed. Please try again.</p>

      <a
        href="/auth/microsoft"
        class="btn-ms w-full flex items-center justify-center gap-3 bg-[#0078d4] text-white rounded-lg py-[11px] px-4 text-sm font-semibold no-underline transition-colors duration-150"
        aria-label="Sign in with Microsoft"
      >
        <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
          <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
          <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
        </svg>
        Sign in with Microsoft
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const error = computed(() => route.query.error === 'oauth')
</script>

<style scoped>
.btn-ms:hover { background-color: #006cbf; }
</style>
