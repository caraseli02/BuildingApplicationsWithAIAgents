import type { RunRecord, RunRequestPayload } from '~/shared/run-types'
import { createMockRun } from '../../utils/mock-run'
import { RUN_RECORD_SCHEMA_VERSION } from '../../utils/run-schema'
import { saveRun } from '../../utils/run-store'
import { runPythonScenario } from '../../utils/python-runner'

function failedRun(input: RunRequestPayload, errorMessage: string): RunRecord {
  return {
    schemaVersion: RUN_RECORD_SCHEMA_VERSION,
    id: `failed-${crypto.randomUUID()}`,
    scenarioKey: 'ecommerce_customer_support',
    title: 'Ecommerce support run',
    status: 'failed',
    createdAt: new Date().toISOString(),
    input,
    dataOrigin: 'real',
    modeUsed: 'auto',
    finalResponse: 'The live run did not complete. Check the failure note and retry in mock mode if needed.',
    errorMessage,
    timeline: [
      {
        id: 'run-started',
        type: 'run_started',
        title: 'Run started',
        summary: 'The adapter received a live run request.',
        at: new Date().toISOString(),
        status: 'info',
        details: { input }
      },
      {
        id: 'run-failed',
        type: 'run_failed',
        title: 'Run failed',
        summary: errorMessage,
        at: new Date().toISOString(),
        status: 'error',
        details: { retry: 'Try mock mode if your local model environment is not ready.' }
      }
    ],
    observability: {
      logs: 'unavailable',
      traces: 'unavailable',
      note: 'No telemetry panel is shown for a failed live run unless the adapter captures real observability data.'
    }
  }
}

export default defineEventHandler(async (event) => {
  const input = await readBody<RunRequestPayload>(event)

  if (input.mode === 'mock') {
    return saveRun(createMockRun(input))
  }

  try {
    return saveRun(await runPythonScenario(input))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown adapter failure'
    return saveRun(failedRun(input, message))
  }
})
