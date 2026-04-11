---
status: complete
priority: p2
issue_id: "002"
tags: [code-review, python, dependencies, langgraph, architecture]
dependencies: []
---

# Align package metadata with the new Studio dependency path

## Problem Statement

The new Studio workflow only works because the docs explicitly bypass the package metadata with `pip install --no-deps -e .` and then install a separate `requirements-langsmith-studio.txt`. The package metadata in [pyproject.toml](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/pyproject.toml#L8) still pins an older LangGraph stack that downgrades the CLI to a version without `langgraph dev`.

This is fragile. Any contributor who follows a normal editable install flow, or any tool that respects `pyproject.toml` dependencies, can silently rebuild an environment that breaks the repo’s newly documented primary workflow.

## Findings

- The base package metadata still pins `langchain==0.1.20`, `langchain-openai==0.1.4`, and `langgraph==0.0.28` in [pyproject.toml](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/pyproject.toml#L8).
- The new docs now depend on `pip install --no-deps -e .` in [README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/README.md#L111), [START_HERE.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/START_HERE.md#L20), [frontend/README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/README.md#L64), and [docs/langsmith-studio.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/langsmith-studio.md#L30).
- In isolated validation, installing the repo with normal metadata caused `langgraph-cli` to resolve to an older version where `langgraph dev` did not exist. The documented flow only became valid after bypassing metadata and installing a modern dedicated requirements set.

## Proposed Solutions

### Option 1: Add a proper optional dependency group for Studio

**Approach:** Move the modern Studio stack into `pyproject.toml` as an extra such as `.[studio]`, while keeping the base package stable for legacy examples.

**Pros:**
- Uses standard Python packaging instead of a metadata bypass.
- Makes Studio setup explicit and reproducible.
- Easier for tooling and future contributors.

**Cons:**
- Requires some packaging refactor.
- May reveal deeper compatibility gaps in the codebase.

**Effort:** 2-4 hours

**Risk:** Medium

---

### Option 2: Update the base package metadata to the modern stack

**Approach:** Replace the old LangGraph-related pins in `pyproject.toml` with the validated Studio-compatible versions and re-test the repo examples.

**Pros:**
- Single source of truth.
- Removes the split-brain dependency model.
- Best long-term developer experience if compatible.

**Cons:**
- Higher regression risk for older examples and tests.
- May require code updates beyond docs.

**Effort:** 4-8 hours

**Risk:** Medium to High

---

### Option 3: Keep the split but formalize it with a script and explicit caveats

**Approach:** Retain `requirements-langsmith-studio.txt`, but add a bootstrap script or Make target that always installs the safe sequence and warns against plain `pip install -e .`.

**Pros:**
- Lower-risk than changing metadata immediately.
- Makes the fragile path harder to misuse.

**Cons:**
- Still leaves package metadata inaccurate for the primary workflow.
- Tooling that ignores the script can still break the environment.

**Effort:** 1-2 hours

**Risk:** Medium

## Recommended Action

Make Studio a first-class packaging path by aligning the core metadata to the validated modern LangGraph stack and adding a proper `studio` optional dependency group for the Agent Server tooling.

## Technical Details

**Affected files:**
- [pyproject.toml](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/pyproject.toml)
- [requirements-langsmith-studio.txt](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/requirements-langsmith-studio.txt)
- [README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/README.md)
- [START_HERE.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/START_HERE.md)
- [docs/langsmith-studio.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/docs/langsmith-studio.md)
- [frontend/README.md](/Users/vladislavcaraseli/.codex/worktrees/a71c/BuildingApplicationsWithAIAgents/frontend/README.md)

## Resources

- **Review target:** current `codex/next-work` working tree
- **Validation note:** isolated modern environment successfully served `langgraph dev` only after bypassing the old package metadata
- **Pattern note:** no directly relevant past solution doc found in `docs/solutions/`

## Acceptance Criteria

- [ ] The Studio setup no longer relies on an undocumented dependency bypass as the core compatibility mechanism
- [ ] A normal, documented install path exists for the primary Studio workflow
- [ ] The chosen packaging strategy is reflected consistently in docs and repo metadata

## Work Log

### 2026-04-11 - Review discovery

**By:** Codex

**Actions:**
- Compared the new Studio docs against the existing package metadata
- Validated that old metadata resolves a CLI without `langgraph dev`
- Confirmed the new documented path only works because it bypasses `pyproject.toml` dependencies

**Learnings:**
- The Studio pivot is operationally correct but packaging-wise still transitional
- Treating Studio as the primary workflow raises the bar for making dependency installation robust

### 2026-04-11 - Fix completed

**By:** Codex

**Actions:**
- Updated `pyproject.toml` base dependencies to the validated modern LangGraph stack
- Added `[project.optional-dependencies].studio` with `langgraph-cli[inmem]` and `langsmith`
- Updated `requirements.txt` to match the new package baseline
- Removed the temporary `requirements-langsmith-studio.txt` workaround and rewrote docs to use `pip install -e ".[studio]"`
- Validated the new path in a clean virtualenv and confirmed `langgraph dev` served `{"ok":true}` on `http://127.0.0.1:2024/ok`

**Learnings:**
- The cleanest fix was not more documentation around the workaround, but making the Studio path real package metadata
- Keeping packaging and docs aligned removes the most failure-prone part of the Studio pivot

## Notes

- This is a packaging and developer-experience risk, not a runtime bug in the LangGraph config itself.
