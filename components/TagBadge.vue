<template>
  <span
    class="tag-badge inline-flex items-center gap-[3px] py-[2px] px-2 rounded-full text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap leading-relaxed"
    :style="{ border: `1px solid ${tag.color}`, color: tag.color, backgroundColor: 'transparent' }"
  >
    {{ tag.label }}
    <button
      v-if="removable"
      class="bg-transparent border-none cursor-pointer text-[13px] leading-none p-0 text-[inherit] opacity-70 ml-[1px] hover:opacity-100"
      :aria-label="`Remove tag ${tag.label}`"
      @click.stop="$emit('remove', tag.id)"
    >×</button>
  </span>
</template>

<script setup lang="ts">
import type { Tag } from '~/stores/kanban'

defineProps<{ tag: Tag; removable?: boolean }>()
defineEmits<{ remove: [id: string] }>()
</script>
