<template>
  <span
    class="tag-badge"
    :style="{ backgroundColor: tag.color, color: contrastText(tag.color) }"
  >
    {{ tag.label }}
    <button
      v-if="removable"
      class="bg-transparent border-none cursor-pointer leading-none p-0 -mr-1 rounded-full text-[inherit] opacity-70 hover:opacity-100 focus:opacity-100"
      :aria-label="`Remove tag ${tag.label}`"
      @click.stop="$emit('remove', tag.id)"
    >
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import type { Tag } from '~/stores/kanban'
import { contrastText } from '~/composables/useContrastText'

defineProps<{ tag: Tag; removable?: boolean }>()
defineEmits<{ remove: [id: string] }>()
</script>
