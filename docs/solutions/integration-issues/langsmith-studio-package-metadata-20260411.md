---
module: System
date: 2026-04-11
problem_type: integration_issue
component: packaging
symptoms:
  - "A normal `pip install -e .` could resolve an older LangGraph stack where `langgraph dev` was unavailable"
  - "The documented Studio workflow only worked when the repo was installed with `--no-deps` and then patched with a separate requirements file"
root_cause: stale_dependency_metadata
resolution_type: code_fix
severity: medium
tags: [langsmith, langgraph, packaging, pyproject, dependencies, studio]
---

# Troubleshooting: LangSmith Studio needed real package metadata, not a docs-only workaround

## Problem

The repo was pivoted to LangSmith Studio as the primary visual workflow, but the Python packaging metadata still pinned an older LangGraph stack. That meant the new Studio docs were only reliable if the project was installed with `pip install --no-deps -e .` and then supplemented with a separate Studio requirements file.

This was fragile because any normal editable install, or any tool that honored `pyproject.toml`, could rebuild an environment where `langgraph dev` did not exist even though Studio was now the primary documented path.

## Environment

- Module: System
- Affected Component: Python dependency metadata for the local LangGraph Agent Server workflow
- Date: 2026-04-11

## Symptoms

- A standard editable install did not guarantee a Studio-capable environment.
- `langgraph-cli` could resolve to an older version without the `dev` command.
- The docs had to tell users to bypass package metadata with `--no-deps`.
- The setup story was split between `pyproject.toml` and a separate `requirements-langsmith-studio.txt` workaround.

## What Didn't Work

**Attempted Solution 1:** Keep the old package metadata and explain the workaround in docs.
- **Why it failed:** It preserved a split-brain install path. The repo’s official metadata still described an older runtime than the one required by the new primary workflow.

**Attempted Solution 2:** Treat the Studio environment as a one-off extra requirements file.
- **Why it failed:** The workaround functioned, but it was not first-class. A clean reinstall or automation that respected `pyproject.toml` could still produce a broken Studio setup.

## Solution

Move the validated modern LangGraph stack into the repo’s actual package metadata and expose the Studio-specific server tooling as an optional dependency group.

### Code changes

Update the base dependencies in `pyproject.toml` to the modern, validated stack and add a `studio` extra:

```toml
[project]
dependencies = [
  "typing_extensions>=4.10",
  "openai==1.82.0",
  "tiktoken==0.9.0",
  "python-dotenv==1.1.0",
  "langchain==0.3.25",
  "langchain-openai==0.3.18",
  "langgraph==0.4.7"
]

[project.optional-dependencies]
studio = [
  "langgraph-cli[inmem]==0.3.3",
  "langsmith==0.3.42"
]
```

Align `requirements.txt` to the same core versions:

```text
openai==1.82.0
tiktoken==0.9.0
python-dotenv==1.1.0
langchain==0.3.25
langchain-openai==0.3.18
langgraph==0.4.7
```

Then simplify the docs to use one supported install path:

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -e ".[studio]"
cp .env.example .env
langgraph dev
```

This fix was applied in:

- [pyproject.toml](pyproject.toml)
- [requirements.txt](requirements.txt)
- [README.md](README.md)
- [START_HERE.md](START_HERE.md)
- [LEARNING_PLAN.md](LEARNING_PLAN.md)
- [frontend/README.md](frontend/README.md)
- [docs/langsmith-studio.md](docs/langsmith-studio.md)

The temporary `requirements-langsmith-studio.txt` file was removed after the package metadata became authoritative.

## Verification

Validated in a clean virtualenv using the now-supported install flow:

```bash
python3 -m venv /tmp/baai-review-fix
source /tmp/baai-review-fix/bin/activate
pip install --upgrade pip
pip install -e ".[studio]"
python -m pip show agents langgraph langgraph-cli langchain-openai langsmith
```

Confirmed the Agent Server boots from that install and serves health checks:

```bash
langgraph dev
curl http://127.0.0.1:2024/ok
```

Observed result:

```json
{"ok":true}
```

Additional regression checks:

```bash
python3 -m pytest tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py tests/frontend/test_run_explorer.py -q
cd frontend && npm test && npm run build
```

## Why This Works

1. The root cause was metadata drift, not the LangSmith configuration itself. The repo’s declared dependencies lagged behind the new primary workflow.
2. Moving the validated LangGraph stack into `pyproject.toml` makes the normal editable install path accurate again.
3. Putting `langgraph-cli[inmem]` and `langsmith` behind a `studio` extra keeps Studio tooling explicit without forcing it into every non-Studio Python install.
4. Once the metadata became authoritative, the docs no longer needed a `--no-deps` escape hatch or a separate Studio requirements file.

## Prevention

- When a workflow becomes the documented primary path, make the packaging metadata match it instead of relying on a docs-only workaround.
- Prefer optional dependency groups like `.[studio]` over ad hoc sidecar requirements files when a toolchain is real but not always required.
- Validate new install paths in a clean virtualenv, not only in an already-curated local environment.
- If docs require `--no-deps` to function, treat that as a temporary emergency signal that package metadata is probably stale.

## Related Issues

- Related but distinct subprocess-boundary fix: [docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md](docs/solutions/integration-issues/stdout-json-contamination-run-explorer-20260409.md)

