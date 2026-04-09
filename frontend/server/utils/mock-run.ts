import type { RunRecord, RunRequestPayload, TimelineEvent } from '~/shared/run-types'
import { RUN_RECORD_SCHEMA_VERSION } from './run-schema'

function timestamp(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString()
}

function event(partial: Omit<TimelineEvent, 'id' | 'at'>, index: number): TimelineEvent {
  return {
    id: `mock-event-${index}`,
    at: timestamp(index * 300),
    ...partial
  }
}

export function createMockRun(input: RunRequestPayload): RunRecord {
  const timeline: TimelineEvent[] = [
    event(
      {
        type: 'run_started',
        title: 'Run started',
        summary: 'The UI packaged your edited preset and handed it to the adapter.',
        status: 'info',
        details: { input }
      },
      0
    ),
    event(
      {
        type: 'loyalty_checked',
        title: 'Loyalty checked',
        summary: `Loaded loyalty points for ${input.order.customer_id}.`,
        status: 'success',
        details: { loyalty_points: input.order.customer_id === 'CUST123' ? '2500' : '120' }
      },
      1
    ),
    event(
      {
        type: 'tool_called',
        title: 'Tool call planned',
        summary: 'The agent selected one business tool and prepared arguments.',
        status: 'success',
        toolName: input.customerMessage.toLowerCase().includes('cancel') ? 'cancel_order' : 'issue_refund',
        args: input.customerMessage.toLowerCase().includes('cancel')
          ? { order_id: input.order.order_id }
          : { order_id: input.order.order_id, amount: input.order.total },
        routingNote: 'Routing context stays secondary in the timeline.'
      },
      2
    ),
    event(
      {
        type: 'tool_result',
        title: 'Tool result returned',
        summary: 'The chosen business action completed and returned its status.',
        status: 'success',
        output: input.customerMessage.toLowerCase().includes('cancel') ? 'cancelled' : 'refund_queued'
      },
      3
    ),
    event(
      {
        type: 'assistant_reply',
        title: 'Assistant reply',
        summary: 'The agent turned the business action into a customer-facing response.',
        status: 'success',
        output: input.customerMessage.toLowerCase().includes('cancel')
          ? 'Your order has been cancelled.'
          : 'Your refund has been queued.'
      },
      4
    ),
    event(
      {
        type: 'run_finished',
        title: 'Run finished',
        summary: 'Mock mode completed the full run record without calling the live model.',
        status: 'warning',
        details: { mode: 'mock' }
      },
      5
    )
  ]

  const finalResponse = String(timeline[4]?.output ?? 'Mock run completed.')

  return {
    schemaVersion: RUN_RECORD_SCHEMA_VERSION,
    id: `mock-${crypto.randomUUID()}`,
    scenarioKey: 'ecommerce_customer_support',
    title: 'Ecommerce support run',
    status: 'completed',
    createdAt: timestamp(),
    input,
    dataOrigin: 'mock',
    modeUsed: 'mock',
    finalResponse,
    timeline,
    observability: {
      logs: 'mocked',
      traces: 'mocked',
      note: 'Mock mode is useful when the live Python flow or local observability stack is unavailable.'
    }
  }
}
