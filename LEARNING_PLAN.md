# AI Agents Learn-by-Doing Plan

**Goal:** learn this repo by building, not just reading, and use each chapter as a short practice sprint.  
**Mode:** build-first. We start from runnable code, inspect what it does, change one thing, and reflect on why it worked.  
**Mentor loop:** `skim -> run -> inspect -> change -> explain back`

## Current Progress

As of 2026-04-07:

- Chapter 0 is complete
- startup setup and baseline checks were verified locally
- Chapter 1 has been completed far enough to move on
- first code exercise completed in `customer_support_agent.py`
- next step is Chapter 2 with `short_term_memory.py`

---

## How To Use This Plan

Each chapter is one short sprint:

- 15 to 20 minutes: skim the relevant files
- 20 to 30 minutes: run the example and debug setup issues
- 20 to 30 minutes: make one visible code change
- 10 minutes: write two notes

Your two notes at the end of every chapter:

- `What I understand now`
- `What still feels fuzzy`

Every chapter ends with three gates:

- one runnable command
- one visible code change
- one explain-it-back prompt for mentor review

---

## Chapter 0 - Clean Baseline

**Goal:** start from a clean repo and a working Python environment without pretending the whole project is green.

### Read / Inspect

- `README.md`
- `requirements.txt`
- `pyproject.toml`

### Run

```bash
git status --short --branch
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install -e .
pip install pytest pytest-asyncio pytest-mock
OPENAI_API_KEY=${OPENAI_API_KEY:-dummy} ./venv/bin/pytest tests/evaluation tests/observability -q
```

### What to notice

- the editable install is rooted at the repository, not the `src/` directory
- the base dependency files do not install `pytest`, so Chapter 0 installs test tooling explicitly
- some targeted tests only need an API key-shaped value for client construction, so a placeholder `OPENAI_API_KEY` is enough for the baseline check
- Chapter 0 uses targeted checks on purpose. Do not use full `pytest -q` as your day-1 success condition.

### Exercise

- Write down any remaining baseline issues after the targeted test run.
- Do not fix them yet unless they block the next chapter.

### Done when

- `git status` is clean on `main`
- the virtualenv exists
- the targeted tests run, or you have a clear written note on what still blocks them

### Current status

- complete
- verified locally with the startup-safe test path

### Explain back

- Why are we using targeted baseline checks instead of treating full `pytest -q` as the first gate?

---

## Chapter 1 - Repo Orientation with LangGraph Ecommerce

**Goal:** understand the main LangGraph example well enough to describe its flow in plain English.

### Read / Inspect

- `README.md`
- `src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py`
- `tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py`

### Run

Use the ecommerce agent once from a small Python entrypoint or REPL and inspect the output.

### Exercise

- Find the graph nodes, routing decisions, and tool or action steps.
- Make one tiny behavior change in the ecommerce flow.
- Re-run the relevant agent test or manual scenario.

### Done when

- you can explain the graph from input to output without reading comments
- you changed one small behavior and saw the result

### Current status

- complete enough to move on
- exercise done: unknown loyalty points fallback changed from `"unknown"` to `"0"`
- verification: `tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py` passed

### Explain back

- What are the main nodes and decision points in the ecommerce graph?

---

## Chapter 2 - Memory and Reflection

**Goal:** understand how this repo demonstrates short-term memory, semantic memory, and reflexive retry patterns.

### Next action

Start with:

- `src/frameworks/langgraph_agents/short_term_memory.py`

Before running it, answer in plain English:

- what you think short-term memory means in an agent system

### Read / Inspect

- `src/frameworks/langgraph_agents/short_term_memory.py`
- `src/frameworks/langgraph_agents/semantic_memory_langgraph.py`
- `src/frameworks/langgraph_agents/reflexion.py`

### Run

Run each example individually and predict the behavior before executing it.

### Exercise

- Change one memory-related detail or one reflection decision.
- Re-run and compare the new behavior with your prediction.

### Done when

- you can say what each file is teaching and how the patterns differ
- you made one small change and observed a meaningful difference

### Explain back

- When would you want short-term memory, semantic memory, or a reflexion loop?

---

## Chapter 3 - Tool Use and Routing

**Goal:** compare graph-based orchestration with chain-based tool use and skill selection.

### Read / Inspect

- `src/frameworks/langgraph_agents/langgraph_tool.py`
- `src/frameworks/langchain/calculator_tool_use.py`
- `src/frameworks/langchain/semantic_skill_selection.py`
- `src/frameworks/langchain/hierarchical_skill_selection.py`

### Run

Run the LangChain calculator example and at least one skill-selection example.

### Exercise

- Change one tool-selection or routing rule.
- Write a short note on what is simpler in chain-based code and what is easier to control in graph-based code.

### Done when

- you can explain how routing happens in both styles
- you tested one behavior change in a tool or routing path

### Explain back

- What do you lose and what do you gain when you move from a graph to a chain?

---

## Chapter 4 - MCP and Agent Communication

**Goal:** understand how external tools and agent-to-agent communication are wired in this repo.

### Read / Inspect

- `src/common/mcp/MCP_math_server.py`
- `src/common/mcp/MCP_weather_server.py`
- `src/frameworks/langgraph_agents/langgraph_mcp_client.py`
- `src/frameworks/autogen_agents/autogen_mcp_client.py`
- `src/common/a2a/agent_server.py`
- `src/common/a2a/agent_client.py`

### Run

Run one MCP path end to end if possible, even if only locally with the math server.

### Exercise

- Add one small MCP tool change, such as a new math or utility capability.
- Trace the client call path from request to response.

### Done when

- you can explain the boundary between the client and the MCP server
- you made one tool change and confirmed the client can use it

### Explain back

- Why use MCP instead of hardcoding every tool directly inside the agent?

---

## Chapter 5 - Multi-Agent Domain Patterns

**Goal:** compare one focused single-agent domain flow with one multi-agent coordination example.

### Read / Inspect

- one single-agent domain under `src/frameworks/langgraph_agents/`
- one supply-chain multi-agent file under `src/frameworks/langgraph_agents/supply_chain/`

Suggested pair:

- `src/frameworks/langgraph_agents/it_helpdesk/it_helpdesk_agent.py`
- `src/frameworks/langgraph_agents/supply_chain/supply_chain_logistics_multi_agent.py`

### Run

Run or inspect both flows deeply enough to map their topology and state movement.

### Exercise

- Compare where state lives, how decisions are routed, and where failures are likely.
- Extend one branch, rule, or handler in one of the two examples.

### Done when

- you can describe why one problem stays single-agent and the other benefits from multiple agents
- you changed one branch or rule and verified the result

### Explain back

- What is the real reason to split a workflow into multiple agents instead of just adding more nodes?

---

## Chapter 6 - Evaluation

**Goal:** understand how the repo measures agent quality and how datasets are structured.

### Read / Inspect

- `src/common/evaluation/README_Evaluations.md`
- `src/common/evaluation/ai_judge.py`
- `src/common/evaluation/metrics.py`
- `src/common/evaluation/memory_evaluation.py`
- `src/common/evaluation/batch_evaluation.py`
- one JSONL file under `src/common/evaluation/scenarios/`

### Run

Run one evaluation command against an existing dataset.

### Exercise

- Inspect the JSONL format carefully.
- Add a few new evaluation cases to one dataset.
- Re-run the targeted evaluation or tests.

### Done when

- you can explain what is being scored and where the scoring logic lives
- you successfully changed an evaluation dataset and reran the relevant checks

### Explain back

- What makes a useful eval case in this repo, and what would make one misleading?

---

## Chapter 7 - Observability and Capstone

**Goal:** finish with one small but complete agent improvement that includes visibility into what happened.

### Read / Inspect

- `src/common/observability/loki_logger.py`
- `src/common/observability/instrument_tempo.py`
- `src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent_with_traceloop.py`

### Run

Run one observability path and confirm logs or traces are emitted, even if the setup is local-only.

### Exercise

- Build or extend a small agent flow.
- Include at least one tool call.
- Add logging or tracing.
- Evaluate it with a small dataset or targeted check.

### Done when

- one agent flow runs end to end
- one evaluation command succeeds
- one observability path emits useful signal

### Explain back

- If the agent gives a bad answer, how would you use logs, traces, and evals together to debug it?

---

## Repo Landmarks

Use these as your primary anchors while learning:

- `src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py`
- `src/frameworks/langgraph_agents/short_term_memory.py`
- `src/frameworks/langgraph_agents/reflexion.py`
- `src/frameworks/langgraph_agents/langgraph_tool.py`
- `src/common/mcp/MCP_math_server.py`
- `src/common/a2a/agent_server.py`
- `src/common/evaluation/ai_judge.py`
- `src/common/observability/loki_logger.py`

---

## Mentor Rules

Use me as a mentor and helper in this way:

- you do the step first
- you show me the command, output, or code diff
- I help you reason about what happened
- if you get blocked, I help narrow the problem instead of taking the keyboard too early

That keeps this as learning by doing, not learning by watching.
