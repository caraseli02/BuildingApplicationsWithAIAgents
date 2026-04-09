import { describe, expect, it } from 'vitest'
import { deriveRunChatSteps } from '../app/utils/run-chat'
import { RUN_RECORD_SCHEMA_VERSION, type RunRecord } from '../shared/run-types'

function buildRun(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    schemaVersion: RUN_RECORD_SCHEMA_VERSION,
    id: 'run-1',
    scenarioKey: 'ecommerce_customer_support',
    title: 'Ecommerce support run',
    status: 'completed',
    createdAt: '2026-04-09T12:53:47.295Z',
    input: {
      presetId: 'refund-broken-mug',
      mode: 'auto',
      customerMessage: 'My mug arrived broken. Refund?',
      order: {
        order_id: 'A12345',
        status: 'Delivered',
        total: 19.99,
        customer_id: 'CUST123'
      }
    },
    dataOrigin: 'real',
    modeUsed: 'auto',
    finalResponse: 'A refund has been processed.',
    observability: {
      logs: 'unavailable',
      traces: 'unavailable',
      note: 'optional'
    },
    timeline: [
      {
        id: 'evt-1',
        type: 'run_started',
        title: 'Run started',
        summary: 'started',
        at: '2026-04-09T12:53:47.295Z',
        status: 'info'
      },
      {
        id: 'evt-2',
        type: 'loyalty_checked',
        title: 'Loyalty checked',
        summary: 'Loaded loyalty points.',
        at: '2026-04-09T12:53:47.300Z',
        status: 'success',
        details: { loyalty_points: '2500' }
      },
      {
        id: 'evt-3',
        type: 'tool_called',
        title: 'Tool call planned',
        summary: 'Prepared refund tool.',
        at: '2026-04-09T12:53:52.038Z',
        status: 'success',
        toolName: 'issue_refund',
        args: { order_id: 'A12345', amount: 19.99 },
        routingNote: 'Selected issue_refund'
      },
      {
        id: 'evt-4',
        type: 'tool_result',
        title: 'Tool result returned',
        summary: 'refund returned',
        at: '2026-04-09T12:53:52.039Z',
        status: 'success',
        toolName: 'issue_refund',
        output: 'refund_queued'
      },
      {
        id: 'evt-5',
        type: 'assistant_reply',
        title: 'Assistant reply',
        summary: 'The agent turned the tool outcome into a customer-facing answer.',
        at: '2026-04-09T12:53:52.040Z',
        status: 'success',
        output: 'A refund has been processed.'
      },
      {
        id: 'evt-6',
        type: 'run_finished',
        title: 'Run finished',
        summary: 'done',
        at: '2026-04-09T12:53:52.041Z',
        status: 'success',
        details: { event_count: 6 }
      }
    ],
    ...overrides
  }
}

describe('deriveRunChatSteps', () => {
  it('groups prep events and tool evidence into readable chat steps', () => {
    const steps = deriveRunChatSteps(buildRun())

    expect(steps).toHaveLength(2)
    expect(steps[0]).toMatchObject({
      kind: 'prep',
      userMessage: 'My mug arrived broken. Refund?'
    })
    expect(steps[1]).toMatchObject({
      kind: 'assistant',
      assistantMessage: 'A refund has been processed.'
    })
    expect(steps[1].toolCards).toHaveLength(1)
    expect(steps[1].toolCards[0]).toMatchObject({
      toolName: 'issue_refund',
      output: 'refund_queued'
    })
    expect(steps[1].supportingEvents.map((event) => event.type)).toContain('run_finished')
  })

  it('creates a failure step when the run fails before an assistant reply', () => {
    const steps = deriveRunChatSteps(buildRun({
      status: 'failed',
      errorMessage: 'OpenAI request failed',
      timeline: [
        {
          id: 'evt-start',
          type: 'run_started',
          title: 'Run started',
          summary: 'started',
          at: '2026-04-09T12:53:47.295Z',
          status: 'info'
        },
        {
          id: 'evt-fail',
          type: 'run_failed',
          title: 'Run failed',
          summary: 'OpenAI request failed',
          at: '2026-04-09T12:53:48.295Z',
          status: 'error',
          details: { retry: 'try again' }
        }
      ]
    }))

    expect(steps.at(-1)).toMatchObject({
      kind: 'failure',
      assistantMessage: 'OpenAI request failed'
    })
  })
})
