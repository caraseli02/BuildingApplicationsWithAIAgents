import type { RunChatStep, RunRecord, RunToolCard, TimelineEvent } from '~/shared/run-types'

function buildToolCard(event: TimelineEvent): RunToolCard {
  return {
    id: event.id,
    toolName: event.toolName ?? 'tool',
    summary: event.summary,
    args: event.args ?? null,
    output: undefined,
    routingNote: event.routingNote,
    status: event.status
  }
}

function prepSummary(events: TimelineEvent[]) {
  if (!events.length) {
    return 'The run started without a preparatory step.'
  }

  if (events.some((event) => event.type === 'loyalty_checked')) {
    return 'The assistant loaded order context and loyalty state before taking action.'
  }

  return events.map((event) => event.summary).join(' ')
}

function createPrepStep(run: RunRecord, events: TimelineEvent[]): RunChatStep {
  return {
    id: `prep-${events[0]?.id ?? run.id}`,
    kind: 'prep',
    title: 'You started a support request',
    summary: prepSummary(events),
    at: events[0]?.at ?? run.createdAt,
    status: events.some((event) => event.status === 'error') ? 'error' : 'info',
    userMessage: run.input.customerMessage,
    toolCards: [],
    supportingEvents: events
  }
}

function createAssistantStep(
  run: RunRecord,
  responseEvent: TimelineEvent,
  toolCards: RunToolCard[],
  supportingEvents: TimelineEvent[]
): RunChatStep {
  return {
    id: `assistant-${responseEvent.id}`,
    kind: 'assistant',
    title: 'Assistant response',
    summary: responseEvent.summary,
    at: responseEvent.at,
    status: responseEvent.status,
    userMessage: undefined,
    assistantMessage: typeof responseEvent.output === 'string' ? responseEvent.output : run.finalResponse,
    toolCards,
    supportingEvents
  }
}

function createFailureStep(
  run: RunRecord,
  failureEvent: TimelineEvent,
  toolCards: RunToolCard[],
  supportingEvents: TimelineEvent[]
): RunChatStep {
  return {
    id: `failure-${failureEvent.id}`,
    kind: 'failure',
    title: 'Run failed',
    summary: failureEvent.summary,
    at: failureEvent.at,
    status: 'error',
    userMessage: run.input.customerMessage,
    assistantMessage: run.errorMessage ?? run.finalResponse,
    toolCards,
    supportingEvents
  }
}

export function deriveRunChatSteps(run: RunRecord): RunChatStep[] {
  const steps: RunChatStep[] = []
  const prepEvents: TimelineEvent[] = []
  const pendingToolCards = new Map<string, RunToolCard>()
  const orderedToolCards: RunToolCard[] = []
  const pendingSupportingEvents: TimelineEvent[] = []

  for (const event of run.timeline) {
    if (event.type === 'run_started' || event.type === 'loyalty_checked') {
      prepEvents.push(event)
      continue
    }

    if (event.type === 'tool_called') {
      const card = buildToolCard(event)
      pendingToolCards.set(event.id, card)
      orderedToolCards.push(card)
      continue
    }

    if (event.type === 'tool_result') {
      const matchingCard = [...pendingToolCards.values()].find((card) => card.toolName === event.toolName && card.output === undefined)
      if (matchingCard) {
        matchingCard.output = event.output
        matchingCard.status = event.status
      }
      pendingSupportingEvents.push(event)
      continue
    }

    if (event.type === 'assistant_reply') {
      if (prepEvents.length) {
        steps.push(createPrepStep(run, prepEvents.splice(0)))
      }

      steps.push(createAssistantStep(run, event, [...orderedToolCards], [...pendingSupportingEvents]))
      orderedToolCards.length = 0
      pendingSupportingEvents.length = 0
      pendingToolCards.clear()
      continue
    }

    if (event.type === 'run_failed') {
      if (prepEvents.length) {
        steps.push(createPrepStep(run, prepEvents.splice(0)))
      }

      steps.push(createFailureStep(run, event, [...orderedToolCards], [...pendingSupportingEvents]))
      orderedToolCards.length = 0
      pendingSupportingEvents.length = 0
      pendingToolCards.clear()
      continue
    }

    pendingSupportingEvents.push(event)
  }

  if (!steps.length && prepEvents.length) {
    steps.push(createPrepStep(run, prepEvents))
  }

  if (steps.length && pendingSupportingEvents.length) {
    steps[steps.length - 1].supportingEvents.push(...pendingSupportingEvents)
  }

  if (!steps.length) {
    steps.push({
      id: `fallback-${run.id}`,
      kind: run.status === 'failed' ? 'failure' : 'assistant',
      title: run.status === 'failed' ? 'Run failed' : 'Assistant response',
      summary: run.status === 'failed' ? (run.errorMessage ?? 'The run failed without a structured error event.') : 'The run completed without a grouped assistant step.',
      at: run.createdAt,
      status: run.status === 'failed' ? 'error' : 'success',
      userMessage: run.input.customerMessage,
      assistantMessage: run.finalResponse,
      toolCards: [...orderedToolCards],
      supportingEvents: [...prepEvents, ...pendingSupportingEvents]
    })
  }

  return steps
}
