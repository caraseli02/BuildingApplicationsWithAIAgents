<script setup lang="ts">
import type { ObservabilityPanelState } from '~/shared/run-types'

defineProps<{
  observability: ObservabilityPanelState
}>()
</script>

<template>
  <section class="panel panel-stack">
    <div>
      <p class="eyebrow">Observability</p>
      <h2 class="panel-title">Logs and traces are optional in V1.</h2>
      <p class="section-copy">
        This panel makes the mixed-mode behavior explicit instead of pretending instrumentation is always available.
      </p>
    </div>

    <div class="split-grid">
      <div class="run-card">
        <p class="run-card__title">Logs</p>
        <StatusPill :label="observability.logs" :tone="observability.logs === 'available' ? 'real' : observability.logs === 'mocked' ? 'mocked' : 'warning'" />
      </div>
      <div class="run-card">
        <p class="run-card__title">Traces</p>
        <StatusPill :label="observability.traces" :tone="observability.traces === 'available' ? 'real' : observability.traces === 'mocked' ? 'mocked' : 'warning'" />
      </div>
    </div>

    <p class="muted">{{ observability.note }}</p>
  </section>
</template>
