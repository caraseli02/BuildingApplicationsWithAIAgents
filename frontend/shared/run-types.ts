export type RunExecutionMode = 'auto' | 'mock'
export type RunStatus = 'completed' | 'failed'
export type RunDataOrigin = 'real' | 'mock'
export const RUN_RECORD_SCHEMA_VERSION = 2
export type TimelineEventType =
  | 'run_started'
  | 'loyalty_checked'
  | 'tool_called'
  | 'tool_result'
  | 'assistant_reply'
  | 'run_finished'
  | 'run_failed'

export interface ScenarioOrderInput {
  order_id: string
  status: string
  total: number
  customer_id: string
}

export interface RunPreset {
  id: string
  title: string
  description: string
  customerMessage: string
  order: ScenarioOrderInput
}

export interface RunRequestPayload {
  presetId: string
  mode: RunExecutionMode
  customerMessage: string
  order: ScenarioOrderInput
}

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  summary: string
  at: string
  status: 'info' | 'success' | 'warning' | 'error'
  toolName?: string
  args?: Record<string, unknown> | null
  output?: unknown
  routingNote?: string
  details?: Record<string, unknown> | null
}

export type RunDetailTab = 'chat' | 'timeline'

export interface RunToolCard {
  id: string
  toolName: string
  summary: string
  args?: Record<string, unknown> | null
  output?: unknown
  routingNote?: string
  status: TimelineEvent['status']
}

export interface RunChatStep {
  id: string
  kind: 'prep' | 'assistant' | 'failure'
  title: string
  summary: string
  at: string
  status: TimelineEvent['status']
  userMessage?: string
  assistantMessage?: string
  toolCards: RunToolCard[]
  supportingEvents: TimelineEvent[]
}

export interface ObservabilityPanelState {
  logs: 'available' | 'mocked' | 'unavailable'
  traces: 'available' | 'mocked' | 'unavailable'
  note: string
}

export interface RunRecord {
  schemaVersion: number
  id: string
  scenarioKey: 'ecommerce_customer_support'
  title: string
  status: RunStatus
  createdAt: string
  input: RunRequestPayload
  dataOrigin: RunDataOrigin
  modeUsed: RunExecutionMode
  finalResponse: string
  timeline: TimelineEvent[]
  observability: ObservabilityPanelState
  errorMessage?: string
}
