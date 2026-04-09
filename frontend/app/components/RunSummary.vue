<script setup lang="ts">
import type { RunRecord } from '~/shared/run-types'

const props = defineProps<{
  run: RunRecord
}>()

const { formatDateTime } = useRunExplorer()
</script>

<template>
  <section class="hero-panel panel-stack">
    <div class="cta-row">
      <div class="section-head section-head--compact">
        <p class="eyebrow">Run detail</p>
        <h1 class="section-title">{{ props.run.title }}</h1>
        <p class="section-copy">A report view of the run outcome, customer prompt, and the live or mocked execution path behind it.</p>
      </div>
      <div class="summary-pills">
        <StatusPill :label="props.run.status" :tone="props.run.status === 'completed' ? 'completed' : 'failed'" />
        <StatusPill :label="props.run.dataOrigin" :tone="props.run.dataOrigin === 'real' ? 'real' : 'mocked'" />
      </div>
    </div>

    <div class="summary-quote">
      <p class="eyebrow">Final response</p>
      <p class="summary-quote__text">{{ props.run.finalResponse }}</p>
    </div>

    <div class="summary-grid summary-grid--detail">
      <div class="detail-block">
        <p class="eyebrow">Started</p>
        <p>{{ formatDateTime(props.run.createdAt) }}</p>
      </div>

      <div class="detail-block">
        <p class="eyebrow">Customer message</p>
        <p>{{ props.run.input.customerMessage }}</p>
      </div>

      <div v-if="props.run.errorMessage" class="detail-block">
        <p class="eyebrow">Failure note</p>
        <p>{{ props.run.errorMessage }}</p>
      </div>
    </div>
  </section>
</template>
