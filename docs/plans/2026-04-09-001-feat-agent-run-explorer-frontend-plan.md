---
title: feat: Add agent run explorer frontend
type: feat
status: active
date: 2026-04-09
origin: docs/brainstorms/2026-04-09-agent-run-explorer-requirements.md
---

# feat: Add agent run explorer frontend

## Overview

Add a first frontend to the repo that lets the user trigger one agent scenario from a browser and inspect the resulting run as a timeline-first experience. The V1 should stay intentionally narrow: one scenario, one primary execution flow, mixed real/mock mode where needed, and a UI optimized for personal use rather than broad product polish.

This plan carries forward the brainstorm decisions to make the frontend a practical run explorer instead of a generic dashboard or agent builder (see origin: `docs/brainstorms/2026-04-09-agent-run-explorer-requirements.md`).

## Problem Statement / Motivation

The repo already contains strong agent examples, shared scenario datasets, and observability helpers, but the current entry points are code, CLI runs, and raw logs. That creates unnecessary friction when the goal is to understand what happened during a run and to build a Vue/Nuxt surface through real usage rather than toy UI exercises.

The e-commerce customer support flow is the best initial anchor because:

- it already has a clear LangGraph entry point and bounded graph structure in [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py#L95)
- it emits concrete tool activity through business tools and Loki logging in [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py#L36) and [src/common/observability/loki_logger.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/common/observability/loki_logger.py#L5)
- it has deterministic flow coverage in [tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py#L20)

## Proposed Solution

Create a small Nuxt app as the repo's first frontend surface, backed by a thin local adapter layer that can trigger the existing Python scenario and normalize its output into timeline-friendly events.

Recommended structure:

- Add a dedicated frontend workspace rather than mixing Nuxt into the current Python packaging setup.
- Use one scenario-focused flow for V1: e-commerce customer support.
- Provide a run launcher with preset examples that are editable before execution.
- Persist the user's current run state only as much as needed for the active local session.
- Show a timeline-first run detail view where tool calls and outputs are the main signal, with routing/decision context presented as supporting metadata.
- Allow partial or mocked panels for observability details that are not yet easy to wire from Loki/Tempo.

Recommended runtime shape:

1. Nuxt handles the browser UI and local full-stack routes.
2. A small adapter endpoint triggers the Python agent flow and captures structured execution data.
3. The adapter returns a normalized run payload with:
   - run metadata
   - input snapshot
   - timeline events
   - final response
   - optional observability/log pointers
4. The Nuxt UI renders that payload without needing to understand LangChain/LangGraph message internals directly.

This aligns with current Nuxt guidance to use `useFetch` / `useAsyncData` for page data and `server/api` routes for local backend behavior, while keeping client-triggered mutations on `$fetch` calls. It also aligns with Vue guidance to keep shared state in composables or small module-scope stores until the app's complexity proves a larger state solution is necessary.

## Technical Considerations

- **Workspace layout**
  - The repo has Python packaging in [pyproject.toml](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/pyproject.toml#L1) but no active frontend scaffold.
  - The README references `package.json` in the directory tree, but no `package.json` currently exists in the repo. Treat the frontend as a net-new workspace, not an extension of an existing JS toolchain.

- **Scenario anchor**
  - The V1 should use the e-commerce LangGraph flow in [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py#L176).
  - Existing tests cover refund and cancel patterns, which gives the frontend a stable first set of preset examples (see [tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py#L20)).

- **Thin adapter**
  - The current agent prints and emits tool/log activity but does not expose a frontend-ready event schema.
  - The first implementation should add a small translation boundary that converts agent execution into a stable event model rather than leaking raw LangChain message objects into the UI.

- **Event model**
  - Treat the timeline as a list of normalized event records such as `run_started`, `loyalty_checked`, `tool_called`, `tool_result`, `assistant_reply`, `run_finished`, and `run_failed`.
  - Routing context should be attached to events or grouped headers, but not replace the timeline as the primary lens.

- **Mixed-mode support**
  - Observability is already available conceptually through Loki and Tempo in [README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/README.md#L135) and [src/common/observability/instrument_tempo.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/common/observability/instrument_tempo.py#L1), but V1 should not depend on full end-to-end telemetry integration.
  - Any incomplete panel should degrade to mock/example data or a clearly labeled unavailable state.

- **Frontend state and data fetching**
  - Use server-render-friendly fetch patterns for initial run lists or presets and client-side mutation calls for triggering runs.
  - Keep state local and composable-first until the feature proves it needs heavier shared state management.

- **Testing**
  - Preserve existing Python tests.
  - Add adapter-level tests around event normalization.
  - Add at least one frontend integration path that proves the user can launch a preset-edited run and inspect returned timeline data.

## System-Wide Impact

- **Interaction graph**
  - User opens the frontend and loads presets.
  - User edits a preset and submits a run.
  - Nuxt server route calls the local adapter.
  - Adapter invokes the Python scenario entry point.
  - Agent performs loyalty check, model invocation, tool calls, and final reply in [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py#L118).
  - Adapter normalizes execution into timeline events and returns the payload to the UI.
  - UI renders timeline cards, result summary, and optional observability sections.

- **Error propagation**
  - Missing `OPENAI_API_KEY` or live model setup failures currently surface as runtime errors in [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py#L95).
  - The adapter must convert these failures into user-facing run states rather than letting raw stack traces become the only output.
  - Mixed mode should allow the UI to continue rendering the run shell even when traces/logs are unavailable.

- **State lifecycle risks**
  - V1 should avoid durable persistence for runs unless clearly needed.
  - The safest first pass is request-scoped execution plus a lightweight in-memory recent-run cache only if needed for navigation or refresh.
  - Do not introduce background jobs, database state, or durable queues in V1.

- **API surface parity**
  - V1 only needs a local browser-facing run API for one scenario.
  - Do not attempt to generalize the adapter across all scenarios or frameworks until the first scenario validates the event model.

- **Integration test scenarios**
  - Successful refund flow with edited preset input.
  - Successful cancel flow with edited preset input.
  - Adapter returns a graceful failed-run payload when live model execution is unavailable.
  - Timeline still renders when observability sections are mocked or unavailable.
  - Re-running a scenario replaces or appends run detail without stale UI state bleed.

## SpecFlow Analysis

### Primary User Flows

1. User lands on the run explorer and sees available preset examples for the e-commerce scenario.
2. User picks a preset, edits the message or order-related input, and launches a run.
3. User sees an in-progress state, then a completed run view.
4. User reads a chronological timeline where tool calls are the dominant visual events.
5. User expands a tool event to inspect arguments, outputs, and supporting routing context.
6. User views the final assistant reply and compares it with the steps that produced it.
7. User optionally views partial observability sections if available, or a clear fallback state if not.

### Key Gaps To Resolve In Implementation

- How the adapter captures event boundaries without brittle parsing of console output.
- Whether the run detail route should be URL-addressable by run id even if storage remains in memory.
- What the loading and failure states look like when the Python side is unavailable or slow.
- How much of the initial order state is editable in V1 versus locked to presets.

### Edge Cases To Cover

- Missing or invalid local environment for live agent execution.
- Tool call succeeds but observability systems are not running.
- User submits a second run before the first UI state has fully settled.
- Run returns minimal messages or no tool calls because of an unexpected model response.
- A preset is edited into malformed input that the adapter must reject or normalize.

## Acceptance Criteria

- [ ] A dedicated frontend workspace exists in the repo and can be started locally without interfering with the Python environment.
- [ ] The frontend exposes one scenario-focused launcher for the e-commerce customer support flow (see origin: `docs/brainstorms/2026-04-09-agent-run-explorer-requirements.md`).
- [ ] Users can start from preset examples and edit them before submitting a run.
- [ ] Submitting a run triggers the underlying Python scenario through a thin adapter rather than requiring terminal-only interaction.
- [ ] The run detail page is centered on a chronological timeline.
- [ ] Tool calls and tool outputs are the most prominent timeline elements.
- [ ] Routing or decision context is visible as supporting information around the timeline events.
- [ ] The UI supports mixed-mode behavior: real execution where available, graceful mocked or unavailable states where integration is incomplete.
- [ ] V1 does not include cross-framework comparison, UI-driven agent editing, auth, or persistence-heavy product features (see origin: `docs/brainstorms/2026-04-09-agent-run-explorer-requirements.md`).
- [ ] Automated coverage exists for adapter event normalization and for at least one end-to-end frontend flow.

## Success Metrics

- A local user can trigger a run and reach a readable run detail view in under one minute from app start.
- The timeline makes it immediately obvious which tools were called, in what order, and what they returned.
- The first scenario can be demoed without opening Python files during the main interaction.
- The resulting frontend structure is clean enough to support future additions such as comparison views or a richer playground without redesigning the core run model.

## Dependencies & Risks

### Dependencies

- Existing Python scenario entry point and tests:
  - [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py)
  - [tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py)
- Existing observability helpers:
  - [src/common/observability/loki_logger.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/common/observability/loki_logger.py)
  - [src/common/observability/instrument_tempo.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/common/observability/instrument_tempo.py)
- Net-new frontend toolchain and local run instructions.

### Risks

- The current Python flow may not expose enough structure for clean event extraction, forcing more adapter work than expected.
- Live model execution can fail locally due to credentials or environment setup, so the frontend must not assume always-on success.
- Adding a frontend workspace introduces a second toolchain into a repo that currently feels Python-first, so setup clarity matters.
- If the event model is too coupled to the first scenario, later expansion will be harder.

## Implementation Phases

### Phase 1: Frontend Foundation

- Create the Nuxt workspace and baseline local scripts.
- Add one landing page and one run detail route.
- Define the initial event schema and mock payloads for UI development.
- Build preset-selection and editable input UX.

### Phase 2: Real Run Adapter

- Add the thin adapter that executes the e-commerce scenario locally.
- Normalize real execution into the shared event schema.
- Handle success, loading, validation, and failure states cleanly.
- Add adapter-level tests.

### Phase 3: Timeline and Observability Integration

- Replace placeholder timeline sections with real normalized events.
- Add supporting routing context and final-answer summary.
- Add optional observability sections using real data where straightforward and explicit fallback states where not.
- Add a frontend integration test for the main trigger-and-inspect flow.

### Phase 4: Polish for Personal Use

- Improve scanability, event grouping, and progressive disclosure in the timeline.
- Tighten loading, empty, and rerun states.
- Document how to start the frontend and what mixed mode means in practice.

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-09-agent-run-explorer-requirements.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/brainstorms/2026-04-09-agent-run-explorer-requirements.md) — key decisions carried forward: agent run explorer scope, one-scenario-first strategy, timeline-first run detail, tool-calls-first priority, mixed real/mock mode.
- **Repo context:** [README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/README.md#L9), [README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/README.md#L98), [README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/README.md#L135)
- **Scenario implementation:** [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py#L36), [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py#L118), [src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py#L176)
- **Scenario tests:** [tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py#L20)
- **Observability helpers:** [src/common/observability/loki_logger.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/common/observability/loki_logger.py#L5), [src/common/observability/instrument_tempo.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/common/observability/instrument_tempo.py#L1)
- **Nuxt docs:** [Data fetching in Nuxt 4](https://nuxt.com/docs/4.x/getting-started/data-fetching), [Nuxt `$fetch` / `useAsyncData`](https://nuxt.com/docs/4.x/api/utils/dollarfetch)
- **Vue docs:** [State management with composables](https://vuejs.org/guide/scaling-up/state-management.html), [TransitionGroup](https://vuejs.org/guide/built-ins/transition-group.html), [List rendering keys](https://vuejs.org/guide/essentials/list.html)
