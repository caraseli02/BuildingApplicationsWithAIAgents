<script setup lang="ts">
import type { RunPreset, RunRequestPayload, RunExecutionMode } from '~/shared/run-types'

const props = defineProps<{
  presets: RunPreset[]
  pending?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: RunRequestPayload]
}>()

const activePresetId = ref(props.presets[0]?.id ?? '')
const mode = ref<RunExecutionMode>('auto')
const draftMessage = ref(props.presets[0]?.customerMessage ?? '')
const draftOrder = reactive<RunRequestPayload['order']>({
  order_id: props.presets[0]?.order.order_id ?? '',
  status: props.presets[0]?.order.status ?? '',
  total: props.presets[0]?.order.total ?? 0,
  customer_id: props.presets[0]?.order.customer_id ?? ''
})

const activePreset = computed(() => props.presets.find((preset) => preset.id === activePresetId.value))
const modeDescription = computed(() => mode.value === 'auto'
  ? 'Use the live Python flow and record the actual tool chain when the local environment is ready.'
  : 'Use a deterministic payload to inspect the interface without waiting on the live model path.'
)

watch(activePresetId, (nextPresetId) => {
  const preset = props.presets.find((item) => item.id === nextPresetId)
  if (!preset) {
    return
  }

  draftMessage.value = preset.customerMessage
  draftOrder.order_id = preset.order.order_id
  draftOrder.status = preset.order.status
  draftOrder.total = preset.order.total
  draftOrder.customer_id = preset.order.customer_id
})

const handleSubmit = () => {
  emit('submit', {
    presetId: activePresetId.value,
    mode: mode.value,
    customerMessage: draftMessage.value,
    order: {
      order_id: draftOrder.order_id,
      status: draftOrder.status,
      total: Number(draftOrder.total),
      customer_id: draftOrder.customer_id
    }
  })
}
</script>

<template>
  <section class="panel panel-stack">
    <div class="section-head section-head--compact">
      <p class="eyebrow">Launch a new run</p>
      <h2 class="panel-title">Start another ecommerce support conversation.</h2>
      <p class="section-copy">
        Start from a preset, adjust the message or order details, then inspect the run as a chat-first conversation with visible tool evidence.
      </p>
    </div>

    <div class="preset-grid">
      <button
        v-for="preset in props.presets"
        :key="preset.id"
        class="preset-card"
        :class="{ 'is-active': preset.id === activePresetId }"
        type="button"
        @click="activePresetId = preset.id"
      >
        <p class="preset-card__eyebrow">Preset {{ props.presets.indexOf(preset) + 1 }}</p>
        <p class="preset-card__title">{{ preset.title }}</p>
        <p class="muted">{{ preset.description }}</p>
      </button>
    </div>

    <form class="form-grid" @submit.prevent="handleSubmit">
      <div class="field">
        <label for="mode">Execution mode</label>
        <select id="mode" v-model="mode">
          <option value="auto">Auto: try the real Python flow first</option>
          <option value="mock">Mock: always return a demo run payload</option>
        </select>
        <p class="field-hint">{{ modeDescription }}</p>
      </div>

      <div class="field">
        <label for="customer-message">Customer message</label>
        <textarea id="customer-message" v-model="draftMessage" />
      </div>

      <div class="split-grid">
        <div class="field">
          <label for="order-id">Order ID</label>
          <input id="order-id" v-model="draftOrder.order_id" type="text">
        </div>
        <div class="field">
          <label for="status">Order status</label>
          <input id="status" v-model="draftOrder.status" type="text">
        </div>
        <div class="field">
          <label for="total">Order total</label>
          <input id="total" v-model.number="draftOrder.total" type="number" min="0" step="0.01">
        </div>
        <div class="field">
          <label for="customer-id">Customer ID</label>
          <input id="customer-id" v-model="draftOrder.customer_id" type="text">
        </div>
      </div>

      <div class="cta-row">
        <div class="launch-footer-copy">
          <p class="launch-footer-copy__label">Active preset</p>
          <strong>{{ activePreset?.title }}</strong>
        </div>
        <button class="button" type="button" :disabled="props.pending" @click="handleSubmit">
          {{ props.pending ? 'Launching run...' : 'Launch run' }}
        </button>
      </div>
    </form>
  </section>
</template>
