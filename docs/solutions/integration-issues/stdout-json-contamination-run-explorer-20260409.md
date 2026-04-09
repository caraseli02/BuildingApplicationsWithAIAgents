---
module: System
date: 2026-04-09
problem_type: integration_issue
component: tooling
symptoms:
  - "Auto-mode run requests returned a structured failed run instead of a completed result"
  - "Nuxt reported `Unexpected token 'T', \"[TOOL] chec\"... is not valid JSON` when calling the Python adapter"
root_cause: wrong_api
resolution_type: code_fix
severity: medium
tags: [nuxt, python-adapter, json, stdout, run-explorer]
---

# Troubleshooting: stdout contamination broke the run explorer JSON contract

## Problem

The new Nuxt run explorer could start the frontend successfully, but the real `auto` execution path failed even after the Python adapter was wired correctly. The browser-facing API expected a clean JSON payload from Python, but the underlying agent printed debug and tool output to standard output, which corrupted the response body before Nuxt tried to parse it.

## Environment

- Module: System
- Rails Version: N/A
- Affected Component: Nuxt-to-Python run adapter for the agent run explorer
- Date: 2026-04-09

## Symptoms

- The frontend loaded and served successfully at `http://127.0.0.1:3000`.
- Posting a real run to `/api/runs` in `auto` mode returned a failed run record instead of live timeline data.
- The failure note inside the run record was `Unexpected token 'T', "[TOOL] chec"... is not valid JSON`.
- Mock mode still worked, which made the failure look like a live-model or environment issue at first glance.

## What Didn't Work

**Attempted Solution 1:** Treat the failure as an API key or environment problem.
- **Why it failed:** The repo's Python flow already loaded environment values via `load_dotenv()`, and the failing response was not a model-auth error. The adapter was receiving output, just not valid JSON.

**Attempted Solution 2:** Assume the Nuxt API route or fetch logic was the source of the parse failure.
- **Why it failed:** The same route worked in mock mode. The corruption only appeared when Python executed the real agent flow, which narrowed the issue to the subprocess boundary.

## Solution

Redirect stdout inside the Python CLI wrapper so that only the final JSON result is written to stdout. Any incidental `print()` calls from the agent flow are captured and forwarded to stderr instead, preserving the machine-readable contract expected by the Nuxt adapter.

**Code changes**:
```python
# Before (broken):
if __name__ == "__main__":
    raw_input = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read()
    print(main(raw_input))

# After (fixed):
if __name__ == "__main__":
    raw_input = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read()
    buffer = io.StringIO()
    with redirect_stdout(buffer):
        result = main(raw_input)
    if buffer.getvalue().strip():
        print(buffer.getvalue(), file=sys.stderr, end="")
    print(result)
```

This fix was applied in [src/common/frontend/run_explorer_cli.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/common/frontend/run_explorer_cli.py).

**Commands run**:
```bash
python3 -m pytest tests/frontend/test_run_explorer.py -q
curl -s http://127.0.0.1:3000/api/runs -X POST -H 'content-type: application/json' --data '{"presetId":"refund-broken-mug","mode":"auto","customerMessage":"My mug arrived broken. Refund?","order":{"order_id":"A12345","status":"Delivered","total":19.99,"customer_id":"CUST123"}}'
```

## Why This Works

1. The root cause was not the frontend request itself. It was the subprocess contract: Nuxt expected stdout to contain exactly one JSON document, but the agent flow also wrote human-oriented debug lines such as tool logs to stdout.
2. Redirecting stdout around the call to `main(raw_input)` isolates all incidental prints from the actual program result.
3. Emitting buffered debug content to stderr preserves visibility for debugging without breaking the adapter protocol. The subprocess can now be both debuggable and machine-readable.

## Prevention

- Treat stdout from any CLI adapter as a strict API boundary. If another process will parse it, reserve stdout for the final payload only.
- Send debug logs, tool traces, and incidental prints to stderr or a structured logging backend instead of mixing them with response output.
- Add at least one end-to-end smoke test for subprocess-backed adapters that verifies the raw stdout is valid JSON.
- When a mixed-mode system works in mock mode but fails in real mode, inspect the subprocess boundary before assuming auth or model configuration is the cause.

## Related Issues

No related issues documented yet.
