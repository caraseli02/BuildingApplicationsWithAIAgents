<script setup lang="ts">
import type { TimelineEvent } from '~/shared/run-types'

const props = defineProps<{
  event: TimelineEvent
}>()

const { formatDateTime, formatEventType } = useRunExplorer()
const json = computed(() => JSON.stringify(props.event.args ?? props.event.output ?? props.event.details ?? {}, null, 2))
</script>

<template>
  <article class="timeline-card">
    <div class="timeline-card__body">
      <div class="cta-row">
        <div>
          <p class="timeline-card__title">{{ formatEventType(props.event) }}</p>
          <p class="muted">{{ props.event.summary }}</p>
        </div>
        <StatusPill :label="props.event.status" :tone="props.event.status === 'success' ? 'completed' : props.event.status === 'error' ? 'error' : props.event.status === 'warning' ? 'warning' : 'mocked'" />
      </div>

      <div class="timeline-meta">
        <span>{{ formatDateTime(props.event.at) }}</span>
        <span>{{ props.event.type }}</span>
        <span v-if="props.event.routingNote">{{ props.event.routingNote }}</span>
      </div>

      <div v-if="props.event.args" class="kv">
        <strong>Arguments</strong>
        <pre class="code-block">{{ json }}</pre>
      </div>

      <div v-else-if="props.event.output || props.event.details" class="kv">
        <strong>Payload</strong>
        <pre class="code-block">{{ json }}</pre>
      </div>
    </div>
  </article>
</template>
