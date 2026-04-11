---
status: complete
priority: p2
issue_id: "001"
tags: [code-review, documentation, portability]
dependencies: []
---

# Replace local filesystem links in committed docs with portable repo links

## Problem Statement

The new Studio rollout adds more absolute workstation-specific links like `/Users/vladislavcaraseli/.codex/worktrees/...` to committed markdown files. Those links only work on the author's machine inside Codex and break for GitHub readers, other contributors, and any clone in a different path.

This matters because the change is primarily documentation-driven. If the links are not portable, the new default workflow is harder to follow for everyone except the local author.

## Findings

- New absolute local links were added in [README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/README.md#L127), [LEARNING_PLAN.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/LEARNING_PLAN.md#L17), [frontend/README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/README.md#L7), and [docs/langsmith-studio.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/langsmith-studio.md#L11).
- These links point into one specific worktree path instead of using relative repository paths.
- The review target is documentation-heavy, so broken links directly reduce the usability of the shipped change.

## Proposed Solutions

### Option 1: Convert all committed markdown links to relative repo paths

**Approach:** Replace workstation-specific absolute paths with relative markdown links such as `docs/langsmith-studio.md` or `frontend/README.md`.

**Pros:**
- Works in GitHub, local clones, and Codex.
- Small, targeted fix.
- Keeps current docs structure intact.

**Cons:**
- Requires touching several files.
- Existing older absolute links elsewhere in the repo may still remain.

**Effort:** 30-60 minutes

**Risk:** Low

---

### Option 2: Use a mixed strategy with relative links in repo docs and absolute links only in chat responses

**Approach:** Keep repository markdown portable, but continue using absolute file links only in assistant responses where the desktop app benefits from them.

**Pros:**
- Matches how the repo should behave across environments.
- Preserves Codex-friendly navigation in chat without polluting committed docs.

**Cons:**
- Requires discipline in future edits.
- Does not automatically fix any pre-existing broken docs outside this diff.

**Effort:** 30-60 minutes

**Risk:** Low

---

### Option 3: Add a docs lint/check for absolute local path links

**Approach:** After converting the links, add a lightweight grep-based check in CI or local validation to catch `/Users/`-style links in committed markdown.

**Pros:**
- Prevents recurrence.
- Makes the rule explicit.

**Cons:**
- Extra tooling for a small repo.
- Still requires the initial cleanup first.

**Effort:** 1-2 hours

**Risk:** Low

## Recommended Action

Replace the machine-specific markdown links in the Studio pivot docs with portable repo-relative links and keep absolute filesystem paths out of committed repository documentation.

## Technical Details

**Affected files:**
- [README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/README.md)
- [LEARNING_PLAN.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/LEARNING_PLAN.md)
- [frontend/README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/README.md)
- [docs/langsmith-studio.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/langsmith-studio.md)

## Resources

- **Review target:** current `codex/next-work` working tree
- **Pattern note:** no directly relevant past solution doc found in `docs/solutions/`

## Acceptance Criteria

- [ ] All newly added markdown links in this change use portable repo-relative paths
- [ ] The Studio docs render correctly in GitHub-style markdown viewers
- [ ] No workstation-specific `/Users/...` links remain in the files touched by this change

## Work Log

### 2026-04-11 - Review discovery

**By:** Codex

**Actions:**
- Reviewed the current working tree changes for the Studio pivot
- Identified multiple new absolute local path links in committed markdown
- Confirmed the issue affects the main docs users will rely on for the new workflow

**Learnings:**
- The repo now depends heavily on documentation for the Studio pivot
- Desktop-app-friendly file links should stay in chat, not in committed docs

### 2026-04-11 - Fix completed

**By:** Codex

**Actions:**
- Replaced the new absolute filesystem links in committed docs with repo-relative markdown links
- Corrected the remaining absolute links in `START_HERE.md`
- Re-checked the touched markdown files with `rg` to confirm the review-targeted local path links were removed

**Learnings:**
- The repo should keep portable markdown in source control even if the desktop app prefers absolute links in chat
- The drift was limited to the Studio pivot docs and was straightforward to clean up once reviewed together

## Notes

- Protected compound-engineering artifacts were preserved; this finding is about link portability, not removing docs.
