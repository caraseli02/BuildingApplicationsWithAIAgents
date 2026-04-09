<script setup lang="ts">
import type { RunPreset, RunRecord, RunRequestPayload } from '~/shared/run-types'

useHead({
  title: 'Agent Run Explorer'
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
  <div class="page-grid page-grid--history-first">
    <RecentRunsPanel :runs="recentRuns ?? []" />
    <LauncherPanel :presets="presets ?? []" :pending="pending" @submit="launchRun" />
  </div>
</template>
