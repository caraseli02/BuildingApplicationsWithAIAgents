<script setup lang="ts">
import type { RunRecord } from '~/shared/run-types'

const props = defineProps<{
  runs: RunRecord[]
}>()

const { formatDateTime } = useRunExplorer()

function messagePreview(run: RunRecord) {
  return run.input.customerMessage.length > 92
    ? `${run.input.customerMessage.slice(0, 89)}...`
    : run.input.customerMessage
}
</script>

<template>
  <section class="hero-panel panel-stack">
    <div class="section-head">
      <p class="eyebrow">Recent runs</p>
      <h2 class="section-title">Pick up the last conversation, not just the next launch.</h2>
      <p class="section-copy section-copy--large">
        The app should feel like a run history surface first. Launching still matters, but the main job is helping you jump back into a real agent exchange quickly.
      </p>
    </div>

    <div v-if="props.runs.length" class="run-list">
      <NuxtLink
        v-for="run in props.runs"
        :key="run.id"
        class="run-card"
        :to="`/runs/${run.id}`"
      >
        <div class="run-card__topline">
          <p class="run-card__title">{{ run.title }}</p>
          <div class="run-card__pills">
            <StatusPill :label="run.status" :tone="run.status === 'completed' ? 'completed' : 'failed'" />
            <StatusPill :label="run.dataOrigin" :tone="run.dataOrigin === 'real' ? 'real' : 'mocked'" />
          </div>
        </div>
        <p class="run-card__message">{{ messagePreview(run) }}</p>
        <div class="meta-row">
          <span>{{ formatDateTime(run.createdAt) }}</span>
          <span>{{ run.timeline.length }} events</span>
          <span>{{ run.input.order.status }}</span>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="empty-state">
      <p class="empty-state__title">No conversation history yet.</p>
      <p class="empty-state__copy">Launch one case from the right-hand desk and it will appear here as your first replayable run.</p>
    </div>
  </section>
</template>
