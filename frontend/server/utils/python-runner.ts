import { promisify } from 'node:util'
import { execFile as execFileCallback } from 'node:child_process'
import { resolve } from 'node:path'
import type { RunRecord, RunRequestPayload } from '~/shared/run-types'

const execFile = promisify(execFileCallback)

export async function runPythonScenario(input: RunRequestPayload): Promise<RunRecord> {
  const frontendRoot = process.cwd()
  const repoRoot = resolve(frontendRoot, '..')
  const pythonBin = process.env.PYTHON_BIN || 'python3'

  const env = {
    ...process.env,
    PYTHONPATH: [resolve(repoRoot, 'src'), process.env.PYTHONPATH].filter(Boolean).join(':')
  }

  const { stdout, stderr } = await execFile(
    pythonBin,
    ['-m', 'common.frontend.run_explorer_cli', JSON.stringify(input)],
    {
      cwd: repoRoot,
      env,
      timeout: 60_000,
      maxBuffer: 1024 * 1024
    }
  )

  if (stderr?.trim()) {
    console.warn(stderr)
  }

  return JSON.parse(stdout) as RunRecord
}
