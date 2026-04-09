<script setup lang="ts">
import type { RunDetailTab, RunRecord } from '~/shared/run-types'
import { deriveRunChatSteps } from '~/utils/run-chat'

const route = useRoute()
const runId = computed(() => route.params.id as string)
const { data: run } = await useFetch<RunRecord>(`/api/runs/${runId.value}`)
const activeTab = ref<RunDetailTab>('chat')

if (!run.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Run not found'
  })
}

const chatSteps = computed(() => deriveRunChatSteps(run.value!))
</script>

<template>
  <div class="panel-stack">
    <div class="cta-row">
      <NuxtLink class="ghost-button" to="/">Back to launcher</NuxtLink>
    </div>

    <RunSummary :run="run!" />

    <section class="panel panel-stack">
      <div>
        <p class="eyebrow">Run view</p>
        <h2 class="panel-title">Read the run like a conversation, inspect it like a system.</h2>
      </div>

      <RunDetailTabs :active-tab="activeTab" @change="activeTab = $event" />

      <div v-if="activeTab === 'chat'" class="chat-step-list">
        <ChatRunStep
          v-for="step in chatSteps"
          :key="step.id"
          :step="step"
        />
      </div>

      <div v-else class="timeline">
        <TimelineEventCard
          v-for="event in run!.timeline"
          :key="event.id"
          :event="event"
        />
      </div>
    </section>

    <ObservabilityPanel :observability="run!.observability" />
  </div>
</template>
