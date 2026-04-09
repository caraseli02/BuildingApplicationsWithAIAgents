import type { RunRecord } from '~/shared/run-types'
import { RUN_RECORD_SCHEMA_VERSION } from './run-schema'

const store = new Map<string, RunRecord>()

export function saveRun(run: RunRecord) {
  store.set(run.id, run)
  return run
}

export function getRun(id: string) {
  const run = store.get(id) ?? null
  if (!run) {
    return null
  }

  if (run.schemaVersion !== RUN_RECORD_SCHEMA_VERSION) {
    store.delete(id)
    return null
  }

  return run
}

export function listRuns() {
  for (const [id, run] of store.entries()) {
    if (run.schemaVersion !== RUN_RECORD_SCHEMA_VERSION) {
      store.delete(id)
    }
  }

  return Array.from(store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
