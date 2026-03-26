<template>
  <span class="tag-badge" :style="{ backgroundColor: tag.color + '22', borderColor: tag.color, color: tag.color }">
    {{ tag.label }}
    <button v-if="removable" class="tag-remove" @click.stop="$emit('remove', tag.id)" title="Remove tag">×</button>
  </span>
</template>

<script setup lang="ts">
import type { Tag } from '~/stores/kanban'

defineProps<{ tag: Tag; removable?: boolean }>()
defineEmits<{ remove: [id: string] }>()
</script>

<style scoped>
.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  line-height: 1.6;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0;
  color: inherit;
  opacity: 0.7;
  margin-left: 1px;
}
.tag-remove:hover { opacity: 1; }
</style>
