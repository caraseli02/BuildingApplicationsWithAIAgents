---
title: refactor: Replace run explorer workflow with LangSmith Studio
type: refactor
status: active
date: 2026-04-10
origin: docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md
---

# refactor: Replace run explorer workflow with LangSmith Studio

## Overview

Replace the custom Nuxt-based run explorer as the primary agent-inspection workflow with LangSmith Studio backed by a local LangGraph Agent Server, while preserving the Vue/Nuxt workspace as an optional sandbox for future repo-specific interfaces.

This plan carries forward the original learning and inspection goals from the run explorer work, but changes the implementation strategy. The repo should stop treating the custom frontend as the main way to understand agent behavior and instead adopt Studio for graph visualization, thread inspection, tool-call replay, and debugging. The existing frontend should be cleaned up where it overlaps directly with Studio, documented as non-primary, and left available for future custom use cases (see origin: `docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md`).

## Problem Statement / Motivation

The custom run explorer achieved the original goal of making one scenario visually inspectable, but it is the wrong layer to invest in as the primary learning tool.

Why this matters:

- The user’s core need is to see what the agent is doing, not to maintain a custom frontend for features that LangSmith Studio already provides better.
- Studio already supports graph-oriented debugging, threads, prompts, tool calls, intermediate state, tracing integrations, and iterative testing. Rebuilding those capabilities in Nuxt would be slow, duplicative, and still weaker than the purpose-built tool.
- The repo currently has no LangGraph Agent Server entrypoint, no `langgraph.json`, and no Studio-oriented documentation or setup flow, so the better workflow is not yet available locally.
- The existing Vue/Nuxt app also introduces maintenance overhead and stale-data issues for a surface that is no longer the best default learning path.

## Proposed Solution

Adopt LangSmith Studio as the default visual development and inspection workflow for the repo’s LangGraph-based Python agents.

At a high level:

1. Add a local Agent Server setup for one or more existing Python LangGraph agents, starting with the ecommerce customer support flow.
2. Create the minimal LangGraph configuration and dependency path needed to run `langgraph dev` locally.
3. Add repo documentation that explains Studio as the default visual inspection workflow and demotes the custom Vue/Nuxt explorer from “main tool” to “optional sandbox”.
4. Remove or archive the parts of the Vue/Nuxt app that duplicate Studio’s core job, while preserving the workspace for future repo-specific or educational surfaces.
5. Verify that the Studio workflow works end to end for a real local agent run and document the expected environment, including LangSmith configuration and privacy/tracing options.

This approach preserves the original requirement that the user be able to inspect agent behavior visually, but it satisfies that requirement by integrating the repo with the better-purpose-built tool rather than extending the custom UI (see origin: `docs/brainstorms/2026-04-09-agent-run-explorer-requirements.md`, `docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md`).

## Technical Considerations

- **Primary integration target**
  Start with `src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py` because it already has a working agent loop, tests, and the clearest direct connection to the recently built frontend workflow.

- **Local Agent Server shape**
  Add a `langgraph.json` that points at a compiled graph or agent entrypoint appropriate for Studio and `langgraph dev`. Based on LangChain’s Python Studio docs, the local server should expose a graph via `langgraph.json` with dependencies and `.env` wiring. Sources:
  - https://docs.langchain.com/oss/python/langgraph/studio
  - https://docs.langchain.com/oss/python/langgraph/local-server

- **Python/runtime requirements**
  Confirm this repo’s Python version and dependency strategy are compatible with `langgraph-cli[inmem]`. The docs currently require Python 3.11+ for the local CLI workflow. If the repo relies on Conda via `langgraph_env.yml`, the Studio setup should align with that rather than introduce a conflicting path.

- **LangSmith/tracing posture**
  Studio requires a LangSmith account and API key for connection, but the docs note that `LANGSMITH_TRACING=false` keeps trace data from leaving the local server. The repo docs should explain this clearly so local inspection does not feel like a forced cloud-tracing step.

- **Frontend preservation strategy**
  Preserve `frontend/` as a valid workspace, but stop positioning it as the main run-inspection interface. Options include:
  - removing the custom run-launch/inspection routes from default docs
  - updating the frontend README to describe it as experimental or future-facing
  - optionally disabling or simplifying the current run explorer pages if they are now redundant
  - keeping shared UI primitives only if they are still useful for future repo-specific dashboards

- **Cleanup boundary**
  This is a refactor of workflow and documentation, not a mandate to delete the entire frontend. The preserved outcome should be:
  - Studio is the default
  - the Nuxt explorer is no longer the recommended path
  - the Vue code remains available for future custom cases

- **Existing learning to carry forward**
  The subprocess stdout/JSON boundary issue captured in `docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md` remains relevant if any local tooling still shells into Python. If the custom run explorer is retained in any reduced form, that subprocess contract must stay protected.

## System-Wide Impact

- **Interaction graph**
  The current primary path is browser -> Nuxt server route -> Python subprocess adapter -> agent -> normalized run payload. This plan changes the default workflow to developer -> `langgraph dev` -> local Agent Server -> LangSmith Studio. The custom browser app becomes secondary. The main reaction chain for learning and debugging moves out of the Nuxt server entirely.

- **Error propagation**
  Failures will shift from frontend fetch or JSON-contract failures to Agent Server startup/configuration/runtime failures. Common error classes will likely include missing `LANGSMITH_API_KEY`, invalid `langgraph.json`, dependency resolution issues, and model/environment configuration failures. The new docs should map these failure modes explicitly so setup errors are diagnosed at the right layer.

- **State lifecycle risks**
  The current custom run explorer uses an in-memory run store and a schema-version invalidation pattern. If Studio becomes the default workflow, those local persisted assumptions should no longer be treated as core product state. The main risk becomes stale repo docs or stale custom frontend code misleading users into using the old path.

- **API surface parity**
  All repo entrypoints that currently point users to the custom frontend for visual inspection should be updated to point to Studio. This likely includes `START_HERE.md`, `LEARNING_PLAN.md`, `frontend/README.md`, and any future setup docs. If the custom frontend remains runnable, it must be labeled consistently as optional and non-primary.

- **Integration test scenarios**
  - Launch `langgraph dev` with the configured graph and confirm the local Agent Server starts cleanly.
  - Open Studio against the local `baseUrl` and run the ecommerce support scenario successfully.
  - Verify a tool-using flow shows expected prompts, tool calls, outputs, and final response in Studio.
  - Verify the repo docs are sufficient for a fresh local setup without relying on prior knowledge from the discarded Nuxt workflow.

## Acceptance Criteria

- [ ] The repo contains a working LangGraph Agent Server configuration for at least one existing Python agent, starting with the ecommerce customer support flow.
- [ ] A documented local workflow exists for launching that agent with `langgraph dev` and opening it in LangSmith Studio.
- [ ] The documentation clearly states that Studio is the primary visual inspection and learning workflow for agents in this repo.
- [ ] The existing Vue/Nuxt run explorer is cleaned up so it no longer presents itself as the default or recommended agent-inspection path.
- [ ] The Vue/Nuxt workspace is preserved for future custom interfaces rather than being fully removed.
- [ ] The plan preserves the original learning goal of visually understanding tool calls, intermediate execution, and final responses, but maps that goal onto Studio instead of the custom run explorer (see origin: `docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md`).
- [ ] Validation includes a real local Studio session and documentation that explains the required environment variables and setup steps.

## Success Metrics

- A new local developer can start from repo docs, run the configured agent server, and open Studio without reverse-engineering the setup.
- The recommended visual learning path for the repo no longer depends on the custom Nuxt run explorer.
- The custom frontend remains usable as an optional sandbox, but the maintenance burden of treating it as the primary agent IDE is removed.
- The user can inspect graph structure, tool calls, outputs, and debugging context more deeply than the current custom frontend allows.

## Dependencies & Risks

### Dependencies

- LangSmith account and API key for Studio connection.
- `langgraph-cli[inmem]` or equivalent installation path compatible with the repo’s Python environment.
- A valid `langgraph.json` targeting a compiled graph or agent entrypoint.
- Documentation updates in the repo root and `frontend/README.md`.

### Risks

- **Runtime mismatch risk**
  The repo may not currently expose its Python agents in the exact structure expected by `langgraph dev`, requiring a small adaptation layer.

- **Docs drift risk**
  If the custom frontend remains runnable but under-documented, users may still follow the wrong workflow.

- **Scope creep risk**
  It will be tempting to fully delete or heavily refactor the Nuxt app. That is outside the core goal. The right move is to de-emphasize and preserve, not to perform a broad frontend rewrite.

- **Tooling confusion risk**
  Studio, LangSmith tracing, LangGraph CLI, and the local Agent Server are related but distinct. The docs must explain their roles clearly.

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md)
  Key decisions carried forward:
  - the core goal is a production-like visual interface for understanding agent behavior
  - tool calls and visible execution evidence remain central to the learning workflow
  - the work is still for personal learning and inspection rather than a broad product surface
  These are preserved, but the implementation path changes from custom chat-first UI to Studio (see origin).

- **Related origin:** [docs/brainstorms/2026-04-09-agent-run-explorer-requirements.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/brainstorms/2026-04-09-agent-run-explorer-requirements.md)

- **Institutional learning:** [docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md)

- **Internal references**
  - [frontend/app/pages/index.vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/pages/index.vue)
  - [frontend/app/pages/runs/[id].vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/pages/runs/[id].vue)
  - [src/common/frontend/run_explorer.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/common/frontend/run_explorer.py)
  - [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py)
  - [langgraph_env.yml](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/langgraph_env.yml)

- **External references**
  - LangSmith Studio overview: https://docs.langchain.com/langsmith/studio
  - Python Studio setup: https://docs.langchain.com/oss/python/langgraph/studio
  - Local Agent Server guide: https://docs.langchain.com/oss/python/langgraph/local-server

