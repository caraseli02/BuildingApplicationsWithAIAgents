<script setup lang="ts">
import type { RunDetailTab } from '~/shared/run-types'

const props = defineProps<{
  activeTab: RunDetailTab
}>()

const emit = defineEmits<{
  change: [tab: RunDetailTab]
}>()

const tabs: Array<{ id: RunDetailTab, label: string, caption: string }> = [
  { id: 'chat', label: 'Chat', caption: 'Production-style grouped conversation' },
  { id: 'timeline', label: 'Timeline', caption: 'Raw chronological event feed' }
]
</script>

<template>
  <div class="tab-bar" role="tablist" aria-label="Run detail views">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-button"
      :class="{ 'is-active': tab.id === props.activeTab }"
      type="button"
      role="tab"
      :aria-selected="tab.id === props.activeTab"
      @click="emit('change', tab.id)"
    >
      <strong>{{ tab.label }}</strong>
      <span>{{ tab.caption }}</span>
    </button>
  </div>
</template>
