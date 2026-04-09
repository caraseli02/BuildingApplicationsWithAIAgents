---
date: 2026-04-09
topic: chat-first-run-explorer-ui
---

# Chat-First Run Explorer UI

## Problem Frame

The first run explorer implementation proves that the architecture works: the UI can trigger a run, receive normalized events, and render a timeline of what happened. But the current presentation still feels more like an internal event viewer than the kind of production agent interface the user wants to learn from and practice against.

The next improvement should keep the current architecture and event model, but change the primary presentation from a timeline-first debug surface to a chat-first experience. The goal is to make each run feel closer to a real agent product while still keeping tool behavior visible and easy to inspect for learning.

## Requirements

- R1. The run detail screen must become chat-first rather than timeline-first.
- R2. The main reading surface must organize the run into grouped conversational steps rather than a flat event feed.
- R3. Each grouped step must present a readable summary first and show related tool activity inline beneath it.
- R4. Tool cards must be visible by default rather than hidden behind dropdowns or collapsed disclosure controls.
- R5. Tool cards must prioritize human-readable content such as tool name, arguments, and result over raw payload dumps.
- R6. The existing timeline view must remain available as a secondary view or tab rather than being removed entirely.
- R7. The home page must shift toward recent-run continuity, making the run history feel more central than the launcher.
- R8. The architecture must remain unchanged for this pass: no move to a long-lived Python server, no queueing system, and no backend architecture rewrite as part of the UI work.

## Success Criteria

- A run feels more like reading a production agent conversation than reading an internal debug log.
- The user can follow what the assistant said and what tools it used without needing to mentally reconstruct the flow from a raw event list.
- Tool activity remains easy to inspect for learning, without requiring dropdown-heavy interaction.
- The old timeline lens is still available when a more mechanical chronological view is useful.
- The improved UI increases perceived product quality without expanding the architecture scope.

## Scope Boundaries

- No backend architecture change in this pass.
- No move away from the current Nuxt-to-Python shell-out model.
- No cross-framework comparison.
- No agent editing, prompt editing, or graph editing from the UI.
- No requirement to fully wire live observability panels.
- No multi-user, auth, or persistence-heavy product features.

## Key Decisions

- Primary presentation shift: Chat-first run view.
  Rationale: This better matches the production interfaces the user wants to learn from while still allowing the same event model underneath.

- Tool visibility: Always visible by default.
  Rationale: The current product is for learning and practice, so hiding tool usage behind dropdowns adds friction without enough benefit.

- Content priority inside each step: Summary plus tool cards.
  Rationale: This keeps the run readable while still exposing the concrete evidence of what the agent actually did.

- Conversation structure: Group by message step.
  Rationale: Grouping user/assistant/tool activity into a single conversational unit makes the run easier to understand than either a pure timeline or a pure chat transcript.

- Existing timeline: Keep as a secondary tab.
  Rationale: The timeline remains useful as a debugging lens and avoids throwing away already useful work.

- Home page direction: Recent runs first.
  Rationale: If the main experience becomes chat-first, the app should start to feel more like a conversation history surface than only a launcher.

- Architecture posture: Hold the current architecture.
  Rationale: The point of this pass is to improve the experience and product feel, not to widen scope into backend redesign.

## Dependencies / Assumptions

- The current normalized run event model is sufficient to derive grouped conversational steps without redesigning the backend.
- The existing run detail surface and timeline components can be repurposed into a secondary view rather than discarded.
- One scenario remains enough for this UI pass.

## Outstanding Questions

### Deferred to Planning

- [Affects R2, R3][Technical] How should normalized events be transformed into grouped conversational steps while preserving tool call fidelity?
- [Affects R3, R5][Technical] What exact fields belong in each visible tool card by default, and what should move into a secondary payload view?
- [Affects R6][Technical] Should the chat and timeline views share a common route with tabs, or separate view states on the same page?
- [Affects R7][Needs research] What home page layout best balances recent-run continuity with the still-important launch action?

## Next Steps

→ /prompts:ce-plan for structured implementation planning
