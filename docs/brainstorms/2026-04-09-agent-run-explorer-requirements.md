---
date: 2026-04-09
topic: agent-run-explorer
---

# Agent Run Explorer

## Problem Frame

The repo already contains valuable agent examples, evaluations, and observability building blocks, but the work is mostly visible through code, CLI execution, and raw logs. That makes it harder to quickly inspect what an agent actually did, and it creates more friction than necessary for refreshing frontend skills while staying close to real agent behavior.

The first frontend surface should make one agent scenario easy to run and inspect visually. It should help the user see concrete agent actions, understand the order of events, and build intuition about routing and tool use without turning V1 into a broad control center.

## Requirements

- R1. The frontend must let the user start a run for one chosen scenario from the UI rather than requiring a terminal-only workflow.
- R2. The run start experience must support preset examples that can be edited before execution.
- R3. The frontend must show a run detail screen centered on a chronological timeline of what happened during the run.
- R4. The timeline must prioritize concrete tool calls and their outputs as the most prominent information.
- R5. The timeline must also show routing or decision context as supporting information around the actions taken.
- R6. The frontend must support mixed-mode data in V1: real execution where available, with mocked or example-backed panels allowed where integration is incomplete.
- R7. V1 must focus on one scenario deeply rather than attempting broad cross-framework coverage.
- R8. The frontend must optimize for personal use and clarity during practice, not for multi-user product polish.

## Success Criteria

- The user can trigger a scenario run from the frontend in a few steps without dropping to the terminal for the main interaction.
- After a run completes, the user can quickly answer: what tools were called, in what order, and what they returned.
- The run detail view makes the scenario easier to understand than reading code or raw logs alone.
- The V1 scope is small enough to finish without needing cross-framework comparison, agent authoring, or full production-grade observability support.

## Scope Boundaries

- No cross-framework comparison in V1.
- No editing of prompts, graph logic, tools, or agent definitions from the UI.
- No requirement to fully integrate all observability systems in V1; partial or mocked panels are acceptable.
- No auth, multi-user support, or persistence-heavy product features.
- No attempt to make V1 a polished general-purpose learning product for outside users.

## Key Decisions

- Primary job: Agent run explorer.
  Rationale: This creates the clearest base for later learning, comparison, and playground flows without over-scoping V1.

- Scenario strategy: One scenario deeply.
  Rationale: A single well-understood scenario is the fastest way to establish the right UI primitives and keep the work finishable.

- Interaction model: Trigger and inspect.
  Rationale: A real execution loop creates more value than a static frontend and better matches the user's goal of refreshing Vue/Nuxt through practical work.

- Data strategy: Mixed real and mock mode.
  Rationale: This preserves momentum while backend adapters or observability surfaces are still incomplete.

- Run detail hero view: Timeline first.
  Rationale: A chronological view is the clearest way to inspect execution before introducing more abstract graph or comparison views.

- Information priority: Tool calls first, routing second.
  Rationale: Concrete actions are the fastest way to understand agent behavior; routing context supports interpretation without dominating the screen.

- Audience: Personal tool.
  Rationale: Optimizing for the user's own workflow keeps scope tight and avoids premature product complexity.

- Run input style: Preset plus editable input.
  Rationale: This combines fast starting points with enough freedom to experiment.

## Dependencies / Assumptions

- At least one existing scenario in the repo can be exposed through a frontend-friendly run flow.
- The initial scenario will likely be the e-commerce customer support flow unless a later brainstorm changes that choice.
- Some execution details may need lightweight normalization before they are comfortable to inspect in a frontend.

## Outstanding Questions

### Deferred to Planning

- [Affects R1, R6][Technical] What is the thinnest backend or adapter approach needed to let the frontend trigger runs and receive timeline-friendly data?
- [Affects R3, R4, R5][Technical] What exact event model should the UI use to represent messages, tool calls, routing steps, and outputs consistently?
- [Affects R6][Needs research] Which parts of the current observability/logging stack are practical to surface in V1 versus leave mocked or deferred?
- [Affects R7][Technical] Which specific scenario should anchor V1, and what repo path is the cleanest integration point for it?

## Next Steps

→ /prompts:ce-plan for structured implementation planning
