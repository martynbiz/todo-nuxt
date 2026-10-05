<template>
  <div class="min-h-screen flex items-center justify-center bg-app-bg px-6 py-6">
    <div class="bg-app-card border border-app-border rounded-2xl p-9 w-full max-w-sm shadow-overlay flex flex-col items-center gap-7">
      <div class="flex flex-col items-center gap-3">
        <span class="w-12 h-12 rounded-2xl bg-app-accent text-app-accent-fg flex items-center justify-center shadow-card" aria-hidden="true">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </span>
        <h1 class="text-xl font-bold text-app-text text-center tracking-tight">Kanban Board</h1>
      </div>

      <p v-if="error" class="text-[13px] text-app-danger text-center">Sign-in failed. Please try again.</p>

      <a
        href="/auth/microsoft"
        class="btn-ms w-full flex items-center justify-center gap-3 bg-app-card text-app-text border border-app-border shadow-card rounded-xl py-[11px] px-4 text-sm font-semibold no-underline transition-colors duration-150 hover:bg-app-hover focus:outline-2 focus:outline-[var(--accent)] focus:outline-offset-2"
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
const error = computed(() => ['oauth', 'session'].includes(route.query.error as string))
</script>

