<script setup lang="ts">
import { computed } from 'vue'
import type { RunChatStep } from '~/shared/run-types'

const props = defineProps<{
  step: RunChatStep
}>()

const { formatDateTime } = useRunExplorer()

const visibleSupportingEvents = computed(() => props.step.supportingEvents)
const statusTone = computed(() => {
  if (props.step.status === 'success') {
    return 'completed'
  }

  if (props.step.status === 'error') {
    return 'error'
  }

  if (props.step.status === 'warning') {
    return 'warning'
  }

  return 'info'
})
</script>

<template>
  <article class="chat-step" :class="`is-${props.step.kind}`">
    <div v-if="props.step.userMessage" class="message-bubble is-user">
      <p class="eyebrow">You</p>
      <p>{{ props.step.userMessage }}</p>
    </div>

    <div class="message-bubble is-assistant">
      <div class="cta-row">
        <div>
          <p class="eyebrow">{{ props.step.title }}</p>
          <h3 class="chat-step__title">{{ props.step.summary }}</h3>
        </div>
        <StatusPill
          :label="props.step.status"
          :tone="statusTone"
        />
      </div>

      <p v-if="props.step.assistantMessage" class="chat-step__message">
        {{ props.step.assistantMessage }}
      </p>

      <div v-if="props.step.toolCards.length" class="tool-card-list">
        <ToolEvidenceCard
          v-for="card in props.step.toolCards"
          :key="card.id"
          :card="card"
        />
      </div>

      <div v-if="visibleSupportingEvents.length" class="supporting-event-list">
        <div
          v-for="event in visibleSupportingEvents"
          :key="event.id"
          class="supporting-event"
        >
          <p class="supporting-event__title">{{ event.title }}</p>
          <p class="supporting-event__summary">{{ event.summary }}</p>
        </div>
      </div>

      <div class="timeline-meta">
        <span>{{ formatDateTime(props.step.at) }}</span>
        <span>{{ props.step.supportingEvents.length }} supporting events</span>
      </div>
    </div>
  </article>
</template>
