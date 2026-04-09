<script setup lang="ts">
import type { RunToolCard } from '~/shared/run-types'

const props = defineProps<{
  card: RunToolCard
}>()

const argsJson = computed(() => JSON.stringify(props.card.args ?? {}, null, 2))
const outputJson = computed(() => JSON.stringify(props.card.output ?? {}, null, 2))
</script>

<template>
  <article class="tool-card">
    <div class="cta-row">
      <div>
        <p class="tool-card__title">{{ props.card.toolName }}</p>
        <p class="muted">{{ props.card.summary }}</p>
      </div>
      <StatusPill
        :label="props.card.status"
        :tone="props.card.status === 'success' ? 'completed' : props.card.status === 'error' ? 'error' : props.card.status === 'warning' ? 'warning' : 'mocked'"
      />
    </div>

    <div v-if="props.card.routingNote" class="tool-card__note">
      {{ props.card.routingNote }}
    </div>

    <div class="split-grid tool-card__payloads">
      <div class="kv">
        <strong>Arguments</strong>
        <pre class="code-block">{{ argsJson }}</pre>
      </div>

      <div class="kv">
        <strong>Result</strong>
        <pre class="code-block">{{ outputJson }}</pre>
      </div>
    </div>
  </article>
</template>
