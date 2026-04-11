<script setup lang="ts">
import type { RunPreset, RunRecord, RunRequestPayload } from '~/shared/run-types'

useHead({
  title: 'Agent Sandbox'
})

const { data: presets } = await useFetch<RunPreset[]>('/api/presets')
const { data: recentRuns, refresh: refreshRuns } = await useFetch<RunRecord[]>('/api/runs')
const pending = ref(false)

const launchRun = async (payload: RunRequestPayload) => {
  pending.value = true

  try {
    const run = await $fetch<RunRecord>('/api/runs', {
      method: 'POST',
      body: payload
    })

    await refreshRuns()
    await navigateTo(`/runs/${run.id}`)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="panel sandbox-notice">
    <p class="eyebrow">Primary workflow</p>
    <p class="sandbox-notice__text">
      LangSmith Studio now replaces this app as the recommended way to inspect agent execution.
      Keep this Nuxt surface for future custom experiments, not as the main debugging tool.
    </p>
  </div>

  <div class="page-grid page-grid--history-first">
    <RecentRunsPanel :runs="recentRuns ?? []" />
    <LauncherPanel :presets="presets ?? []" :pending="pending" @submit="launchRun" />
  </div>
</template>
