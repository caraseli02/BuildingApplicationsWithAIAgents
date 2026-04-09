<script setup lang="ts">
const props = defineProps<{
  label: string
  tone?: 'completed' | 'failed' | 'real' | 'mocked' | 'warning' | 'error' | 'info'
}>()
</script>

<template>
  <span class="status-pill" :class="`is-${props.tone ?? 'completed'}`">
    {{ props.label }}
  </span>
</template>
