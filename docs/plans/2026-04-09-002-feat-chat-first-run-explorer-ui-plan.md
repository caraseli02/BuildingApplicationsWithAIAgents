---
title: feat: Shift run explorer to chat-first UI
type: feat
status: active
date: 2026-04-09
origin: docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md
---

# feat: Shift run explorer to chat-first UI

## Overview

Refactor the current run explorer presentation so the primary run-detail experience feels like a production-style agent conversation rather than an internal event debugger. Keep the existing local shell-out architecture and normalized event model, but change the default reading surface to grouped conversational steps with always-visible tool cards and keep the existing timeline as a secondary tab (see origin: `docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md`).

## Problem Statement / Motivation

The current implementation proves the system works end to end: the Nuxt UI can launch a run, the Python adapter can return normalized events, and the run detail page renders those events successfully. But the existing detail surface is still centered on a flat chronological timeline in [frontend/app/pages/runs/[id].vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/pages/runs/[id].vue#L16), with low-level event cards in [frontend/app/components/TimelineEventCard.vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/components/TimelineEventCard.vue#L12).

That makes the product useful for debugging, but not yet aligned with the type of interfaces the user wants to learn from. The highest-leverage next move is not more backend work; it is a UI reframing:

- read the run like a conversation
- keep tool evidence visible by default
- preserve the mechanical timeline as a secondary debugging lens
- make the home page feel more like run history than a pure launcher

## Proposed Solution

Introduce a chat-first run detail view derived from the existing `RunRecord.timeline` data in [frontend/shared/run-types.ts](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/shared/run-types.ts#L55). Instead of rendering the timeline directly as the primary experience, transform normalized events into grouped conversational steps that pair:

- the user request or step context
- the assistant-facing summary for that step
- one or more visible tool cards with arguments and results
- optional secondary metadata when needed

Recommended UX shape:

1. **Run detail default tab: Chat**
   - Grouped conversational steps, readable top to bottom
   - Tool cards visible inline by default
   - Final assistant answer feels like the main artifact

2. **Run detail secondary tab: Timeline**
   - Preserve current flat event view for debugging and chronological inspection

3. **Home page rebalance**
   - Recent runs become the primary surface
   - Launcher remains available but visually secondary

This keeps the event-driven implementation intact while changing the product feel substantially.

## Technical Considerations

- **Keep architecture fixed**
  - Do not change the current Nuxt-to-Python shell-out path established through [frontend/server/api/runs/index.post.ts](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/server/api/runs/index.post.ts#L46) and [src/common/frontend/run_explorer.py](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/src/common/frontend/run_explorer.py#L61).
  - The planning and implementation focus is presentation, grouping logic, and UI information hierarchy only.

- **Derive, do not redesign, the event model**
  - The current `TimelineEvent` shape already contains titles, summaries, args, outputs, routing notes, and statuses in [frontend/shared/run-types.ts](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/shared/run-types.ts#L35).
  - Add a lightweight derived view model for grouped chat steps rather than replacing the underlying event schema.

- **Chat grouping strategy**
  - The grouping logic should preserve fidelity to the existing event stream while making the screen easier to read.
  - Practical first grouping rule:
    - one step begins with `run_started` or `assistant_reply`
    - tool calls and tool results between assistant-relevant boundaries attach to that step
    - loyalty check and preparation events can become a preparatory step rather than crowding the final answer
  - This rule can evolve, but the first implementation should remain deterministic and easy to reason about.

- **Tool card content**
  - Visible by default:
    - tool name
    - short human-readable summary
    - arguments
    - result
  - Secondary:
    - raw payloads or JSON details only when helpful
    - routing notes as supporting text, not the headline

- **View switching**
  - Use a single run-detail route with local tab state rather than splitting into multiple routes.
  - This preserves the current route shape and allows both lenses to share one fetched `RunRecord`.

- **Homepage continuity**
  - The current home page uses an even split between launcher and recent runs in [frontend/app/pages/index.vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/pages/index.vue#L29).
  - Rebalance it so recent runs feel like the primary landing surface, while the launcher becomes lighter and still easy to access.

- **Preserve learned integration constraints**
  - The subprocess JSON boundary issue documented in [docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md) remains relevant.
  - UI work must not regress the assumption that live runs return a clean `RunRecord` payload.

## System-Wide Impact

- **Interaction graph**
  - Home page loads recent runs and launcher presets as today.
  - User opens a recent run or creates a new run.
  - Run detail fetches one `RunRecord`.
  - A derived UI layer transforms `timeline` events into grouped chat steps.
  - User can switch between:
    - grouped chat view
    - raw timeline view
  - No change to the backend request/response path.

- **Error propagation**
  - Failed runs already come back as structured records from [frontend/server/api/runs/index.post.ts](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/server/api/runs/index.post.ts#L6).
  - The new chat view must still render failed runs gracefully; the grouping logic cannot assume success-only event streams.

- **State lifecycle risks**
  - The in-memory run store remains the same.
  - UI derivation should be pure and read-only against fetched run records.
  - Avoid introducing local state that can desynchronize the timeline and chat views.

- **API surface parity**
  - No API changes are required unless implementation reveals missing fields that make grouping impossible.
  - If additional backend metadata becomes necessary, it should be additive and minimal.

- **Integration test scenarios**
  - Completed real or mock run renders correctly in the chat tab.
  - Failed run renders a coherent chat-style failure state.
  - Switching between Chat and Timeline keeps the same underlying run data.
  - The home page still allows launching a new run after recent-runs-first rebalancing.
  - Tool cards remain visible without requiring expansion controls.

## SpecFlow Analysis

### Primary User Flows

1. User lands on the home page and sees recent runs first, with a lighter launcher still present.
2. User opens a run and lands on the Chat tab by default.
3. User reads the run as grouped conversational steps instead of reconstructing it from flat events.
4. User sees tool cards inline beneath the relevant step without needing dropdown interaction.
5. User switches to the Timeline tab when they want a more mechanical chronological lens.
6. User launches another run and returns to the updated recent-runs-first home page.

### Key Gaps To Resolve In Implementation

- How to group events into conversational steps in a way that works for both successful and failed runs.
- Whether `run_started` and `loyalty_checked` belong in a visible prep step or a lighter system message treatment.
- How much raw payload detail to show without making the chat view collapse back into a debug screen.
- How to rebalance the home page without making run launching feel hidden or awkward.

### Edge Cases To Cover

- Runs with multiple business tools followed by `send_customer_message`.
- Failed runs where the only meaningful events are `run_started` and `run_failed`.
- Mock runs and real runs should both produce coherent grouped steps.
- Runs with sparse payloads should still render useful tool cards.
- Long argument or output payloads should not overwhelm the chat layout.

## Acceptance Criteria

- [ ] The run detail page defaults to a chat-first tab rather than opening directly into the flat timeline (see origin: `docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md`).
- [ ] The chat view organizes each run into grouped conversational steps rather than rendering only a flat event feed.
- [ ] Each step presents a readable summary first and shows related tool cards inline.
- [ ] Tool cards are visible by default; they are not hidden behind dropdowns or collapsed disclosure controls.
- [ ] Tool cards prioritize tool name, arguments, and result over raw payload dumps.
- [ ] The existing timeline remains available as a secondary tab or view on the same run-detail route.
- [ ] The home page is rebalanced so recent runs feel primary and the launcher is visually secondary.
- [ ] Failed runs still render coherently in the new chat-first presentation.
- [ ] Existing run-launching behavior remains intact and no backend architecture change is introduced.
- [ ] Frontend tests cover at least one grouped chat rendering path and one tab-switch or view-switch path.

## Success Metrics

- A user can open a run and understand the conversational flow without needing to decode a flat event stream.
- The UI feels closer to a production agent interface while still preserving inspectability for learning.
- Tool usage remains immediately visible without adding interaction friction.
- The timeline continues to serve as a useful debugging lens rather than being lost in the redesign.

## Dependencies & Risks

### Dependencies

- Current run-detail implementation:
  - [frontend/app/pages/runs/[id].vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/pages/runs/[id].vue)
  - [frontend/app/components/TimelineEventCard.vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/components/TimelineEventCard.vue)
- Current home page:
  - [frontend/app/pages/index.vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/pages/index.vue)
- Current shared event model:
  - [frontend/shared/run-types.ts](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/shared/run-types.ts)
- Known adapter constraint:
  - [docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md)

### Risks

- If the grouping logic is too clever, the UI can become harder to trust than the raw timeline.
- If the chat surface over-compresses detail, the product loses the learning value that justified the tool-first inspection model.
- If the home page leans too hard into history, launching a new run could become less discoverable.
- If the visual redesign is too large without component reuse, the change could sprawl beyond a focused UI pass.

## Implementation Phases

### Phase 1: Derive the Chat View Model

- Add a derived grouped-step model on top of `RunRecord.timeline`.
- Decide deterministic rules for prep events, tool associations, assistant summary steps, and failed-run grouping.
- Add tests around grouping behavior for success and failure cases.

### Phase 2: Build the Chat-First Run Detail

- Create new run-detail components for:
  - tab switcher
  - grouped chat step
  - visible tool card
- Make Chat the default tab and keep Timeline as the secondary view.
- Preserve the existing timeline component path so debugging remains available.

### Phase 3: Rebalance the Home Page

- Shift the home page hierarchy so recent runs are visually primary.
- Keep launching a run quick and obvious, but secondary in emphasis.
- Ensure the route flow between homepage, run detail, and rerun still feels smooth.

### Phase 4: Polish and Verification

- Improve spacing, hierarchy, and scanability for conversation steps and tool cards.
- Tighten mobile and narrow-screen behavior for visible tool cards.
- Add frontend tests for the chat grouping and tab behavior.
- Run the existing frontend verification flow plus a live/manual smoke test.

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/brainstorms/2026-04-09-chat-first-run-explorer-ui-requirements.md) — key decisions carried forward: chat-first run detail, visible tool cards, grouped conversational steps, timeline as secondary tab, recent-runs-first home page, no architecture change.
- **Current run explorer implementation:** [frontend/app/pages/index.vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/pages/index.vue#L8), [frontend/app/pages/runs/[id].vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/pages/runs/[id].vue#L16), [frontend/app/components/TimelineEventCard.vue](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/app/components/TimelineEventCard.vue#L12), [frontend/shared/run-types.ts](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/shared/run-types.ts#L35)
- **Institutional learning:** [docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md)
