import type { TimelineEvent } from '~/shared/run-types'

export function useRunExplorer() {
  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value))

  const formatEventType = (event: TimelineEvent) => {
    if (event.type === 'tool_called' && event.toolName) {
      return `Tool: ${event.toolName}`
    }

    return event.title
  }

  return {
    formatDateTime,
    formatEventType
  }
}
