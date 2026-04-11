# AI Agents Learn-by-Doing Plan

**Goal:** learn this repo by building, predicting, inspecting, and explaining instead of only reading.  
**Primary loop:** `predict -> run -> inspect -> explain -> change`  
**Primary visual surface:** LangSmith Studio for LangGraph chapters, with runtime inspection for chapters that do not map naturally to Studio.

## How This Plan Works

This plan stays organized by repo concepts, not by the external LangChain site structure.

Each chapter has the same required shape:

1. **Predict**
   Write down what you think the agent or program will do before running it.
2. **Run**
   Execute the local example.
3. **Inspect**
   Use Studio when the chapter is graph-native. Otherwise inspect the runtime output, logs, or code path directly.
4. **Explain**
   Describe what actually happened and why.
5. **Change**
   Make one small code or dataset change and verify the effect.

Each chapter is complete only when you produce all three outputs:

- one small code change
- one written explanation
- one trace interpretation or runtime interpretation

## Visual Inspection Default

Use LangSmith Studio as the default visual debugging workflow for LangGraph examples in this repo.

Setup:

- Studio guide: [docs/langsmith-studio.md](docs/langsmith-studio.md)
- Primary entrypoint: [START_HERE.md](START_HERE.md)

Use:

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -e ".[studio]"
cp .env.example .env
langgraph dev
```

Then open:

```text
https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
```

## External Learning Rules

Each chapter may include a small LangChain Docs + Guides bundle.

Use those links this way:

- 1 core docs page to clarify the main concept
- 1 guide to deepen the practical pattern
- optional third link only when it clearly helps

Do not turn a chapter into a reading list. The repo example stays primary.

## Checkpoint Rules

Every chapter has checkpoints.

If you fail a checkpoint:

- stop guessing
- read the targeted LangChain resource for that chapter
- re-run the same example
- write a second prediction before continuing

This makes the plan adaptive without turning it into a fully dynamic curriculum.

## Current Progress

As of 2026-04-11:

- Chapter 0 is complete
- Chapter 1 is complete enough to move on
- first code exercise completed in `customer_support_agent.py`
- next step is Chapter 2 with `short_term_memory.py`

---

## Chapter Template

Each chapter below uses this structure:

- **Concept**
- **Inspection mode**
- **Predict**
- **Run**
- **Inspect**
- **Explain**
- **Change**
- **LangChain links**
- **Checkpoint**

---

## Chapter 0 - Clean Baseline

**Concept:** baseline environment and repo orientation  
**Inspection mode:** runtime inspection

### Predict

Before running anything, answer:

- What will `pip install -e .` actually make importable?
- Why are we using targeted tests instead of full `pytest -q`?

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

### Inspect

- inspect the repo root files:
  - `README.md`
  - `requirements.txt`
  - `pyproject.toml`
- inspect the test output and note which modules are actually covered

### Explain

Write:

- what the editable install does in this repo
- why targeted checks are the right first gate

### Change

Make one tiny environment or documentation note only if something blocks you. Otherwise, leave the code alone and document the baseline accurately.

### LangChain links

- No external links required here. Stay local.

### Checkpoint

You pass when:

- the virtualenv works
- the targeted tests run
- you can explain why the repo does not use full `pytest -q` as the first success gate

If you fail:

- re-read `README.md`
- re-check `pyproject.toml`
- write down exactly what import or install step is still fuzzy

---

## Chapter 1 - LangGraph Ecommerce Orientation

**Concept:** graph structure, tool sequencing, business flow  
**Inspection mode:** full Studio

### Predict

Before running the ecommerce agent, answer:

- Which step happens first after the user message?
- Which business tool will fire for a refund request?
- Why does the flow stop after customer messaging?

### Run

Use Studio with the local Agent Server and run the `ecommerce_support` graph with:

Customer message:

```text
My mug arrived broken. Refund?
```

Example order payload:

```json
{
  "order_id": "A12345",
  "status": "Delivered",
  "total": 19.99,
  "customer_id": "CUST123"
}
```

### Inspect

In Studio, inspect:

- the system prompt
- the first business tool call
- the follow-up `send_customer_message`
- the final assistant reply

Then map the trace back to:

- `src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py`
- `tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py`

### Explain

Write:

- the node sequence from input to finish
- why the chosen business tool was correct
- where in code the tool loop and stop condition live

### Change

Make one small behavior change in the ecommerce flow, then re-run the scenario and explain what changed in Studio.

### LangChain links

- Docs: [LangGraph Studio](https://docs.langchain.com/oss/python/langgraph/studio)
- Guide: [Local Agent Server](https://docs.langchain.com/oss/python/langgraph/local-server)

### Checkpoint

You pass when:

- you can predict the first tool call correctly
- you can explain the final reply using the trace and code
- you made one small change and saw the effect

If you fail:

- re-run the same scenario
- read the two links above
- write a second prediction before retrying

---

## Chapter 2 - Memory and Reflection

**Concept:** short-term memory, semantic memory, reflexion loops  
**Inspection mode:** hybrid runtime inspection, optional Studio reasoning

### Predict

Before running anything, answer:

- what short-term memory means in an agent system
- how semantic memory differs from short-term memory
- what a reflexion loop is trying to improve

### Run

Run and compare:

- `src/frameworks/langgraph_agents/short_term_memory.py`
- `src/frameworks/langgraph_agents/semantic_memory_langgraph.py`
- `src/frameworks/langgraph_agents/reflexion.py`

### Inspect

Inspect:

- message/state evolution
- where memory is stored or reused
- what triggers an extra reflective step

If one example can be wrapped into a graph trace naturally, use Studio. Otherwise use runtime output and code path inspection.

### Explain

Write:

- what each file is teaching
- which state persists only within a run versus across runs
- when reflexion is worth the extra loop

### Change

Change one memory-related detail or one reflexion decision and compare the before/after behavior.

### LangChain links

- Docs: [Short-term memory](https://docs.langchain.com/oss/python/langgraph/add-memory)
- Guide: [Memory overview](https://docs.langchain.com/oss/python/concepts/memory)

### Checkpoint

You pass when:

- you can explain the difference between short-term and semantic memory
- you can explain why reflexion changed or did not change the result
- your change caused an observable difference

If you fail:

- read the two links
- re-run only one file first
- explain one memory mechanism before moving back to all three

---

## Chapter 3 - Tool Use and Routing

**Concept:** graph orchestration versus chain/tool-routing patterns  
**Inspection mode:** runtime inspection

### Predict

Before running the examples, answer:

- what should be simpler in chain-based tool use
- what should be easier to control in graph-based code

### Run

Run:

- `src/frameworks/langgraph_agents/langgraph_tool.py`
- `src/frameworks/langchain/calculator_tool_use.py`
- one of:
  - `src/frameworks/langchain/semantic_skill_selection.py`
  - `src/frameworks/langchain/hierarchical_skill_selection.py`

### Inspect

Inspect:

- how the tool or skill gets selected
- how explicit the routing logic is
- where hidden behavior lives compared with graph nodes

### Explain

Write:

- what routing means in each style
- what becomes easier and harder when moving from graph to chain

### Change

Change one tool-selection or routing rule and verify the effect.

### LangChain links

- Docs: [Tools](https://docs.langchain.com/oss/python/langchain/tools)
- Guide: [Tool calling](https://docs.langchain.com/oss/python/langchain/tool-calling)

### Checkpoint

You pass when:

- you can explain how the tool is chosen in both styles
- you made one routing change and observed the result

If you fail:

- read the two links
- rerun the simpler calculator example first
- explain that one before returning to skill selection

---

## Chapter 4 - MCP and Agent Communication

**Concept:** external tool servers and agent-to-agent boundaries  
**Inspection mode:** runtime inspection

### Predict

Before running anything, answer:

- what the boundary is between an MCP client and server
- why a repo would choose MCP over hardcoded in-process tools

### Run

Inspect and run one path end to end if possible:

- `src/common/mcp/MCP_math_server.py`
- `src/common/mcp/MCP_weather_server.py`
- `src/frameworks/langgraph_agents/langgraph_mcp_client.py`
- `src/frameworks/autogen_agents/autogen_mcp_client.py`
- `src/common/a2a/agent_server.py`
- `src/common/a2a/agent_client.py`

### Inspect

Inspect:

- request shape
- server boundary
- where the response re-enters the agent workflow

### Explain

Write:

- what MCP is buying you architecturally
- what changes when the tool boundary becomes networked or external

### Change

Add one small MCP tool change or utility behavior and confirm the client can still use it.

### LangChain links

- Docs: [Model Context Protocol](https://docs.langchain.com/oss/python/langchain/mcp)
- Guide: [Tools](https://docs.langchain.com/oss/python/langchain/tools)

### Checkpoint

You pass when:

- you can explain the client/server boundary clearly
- you changed one small tool capability and verified it

If you fail:

- diagram the request/response path first
- then re-read the MCP docs link
- retry with the math server only

---

## Chapter 5 - Multi-Agent Domain Patterns

**Concept:** when to keep one focused agent versus split into multiple agents  
**Inspection mode:** runtime inspection, optional Studio for single LangGraph flows

### Predict

Before comparing the examples, answer:

- what kind of problem should stay single-agent
- what kind of problem likely benefits from multiple agents

### Run

Suggested pair:

- `src/frameworks/langgraph_agents/it_helpdesk/it_helpdesk_agent.py`
- `src/frameworks/langgraph_agents/supply_chain/supply_chain_logistics_multi_agent.py`

### Inspect

Inspect:

- where state lives
- how decisions are routed
- what extra complexity appears in the multi-agent case

### Explain

Write:

- why the single-agent example should stay simpler
- what real coordination need justifies the multi-agent version

### Change

Extend one branch, rule, or handler and verify the result.

### LangChain links

- Docs: [Multi-agent](https://docs.langchain.com/oss/python/langgraph/multi-agent)
- Guide: [Workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents)

### Checkpoint

You pass when:

- you can defend why one example is multi-agent and the other is not
- you changed one branch or rule and verified it

If you fail:

- read the multi-agent docs first
- reduce the comparison to one state-flow question
- retry the explanation before making a change

---

## Chapter 6 - Evaluation

**Concept:** judging outputs, datasets, and what good evals look like  
**Inspection mode:** runtime inspection

### Predict

Before running evaluation, answer:

- what should a useful eval case include
- what would make an eval case misleading in this repo

### Run

Inspect:

- `src/common/evaluation/README_Evaluations.md`
- `src/common/evaluation/ai_judge.py`
- `src/common/evaluation/metrics.py`
- `src/common/evaluation/memory_evaluation.py`
- `src/common/evaluation/batch_evaluation.py`
- one JSONL scenario file under `src/common/evaluation/scenarios/`

Run one evaluation command against an existing dataset.

### Inspect

Inspect:

- dataset shape
- what is being scored
- where scoring logic lives

### Explain

Write:

- what this repo is actually measuring
- what separates a strong eval case from a noisy one

### Change

Add a few new eval cases to one dataset and rerun the targeted evaluation or tests.

### LangChain links

- Docs: [Evaluation concepts](https://docs.langchain.com/oss/python/langsmith/evaluation)
- Guide: [Run evaluations](https://docs.langchain.com/langsmith/evaluation-quickstart)

### Checkpoint

You pass when:

- you can explain what is being scored
- you modified a dataset and reran the relevant checks

If you fail:

- inspect one JSONL file line by line
- read the two evaluation links
- rewrite one bad eval case into a better one before retrying

---

## Chapter 7 - Observability and Capstone

**Concept:** traces, logs, evals, and one complete improvement loop  
**Inspection mode:** hybrid Studio + observability

### Predict

Before running anything, answer:

- if the agent gives a bad answer, which signal will help first: trace, log, or eval?
- what kind of failure each signal is best at exposing

### Run

Inspect:

- `src/common/observability/loki_logger.py`
- `src/common/observability/instrument_tempo.py`
- `src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent_with_traceloop.py`

Run one observability path and one end-to-end improvement loop.

### Inspect

Inspect:

- Studio traces
- logs or spans
- any targeted evaluation signal you can produce

### Explain

Write:

- how you would debug a bad answer using traces, logs, and evals together
- which signal is most useful first for the capstone case

### Change

Build or extend a small agent flow that includes:

- one tool call
- one observability signal
- one evaluation or targeted verification step

### LangChain links

- Docs: [Observability with LangSmith](https://docs.langchain.com/langsmith/observability-quickstart)
- Guide: [Trace with LangSmith](https://docs.langchain.com/langsmith/trace-with-langchain)

### Checkpoint

You pass when:

- one agent flow runs end to end
- one observability path emits useful signal
- you can explain how to debug a bad answer with multiple signals

If you fail:

- use only one signal first
- explain what it did and did not tell you
- then add the second signal

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

## Mentor Rules

Use me as a mentor like this:

- you do the step first
- you show me the command, output, or code diff
- I help you reason about what happened
- if you get blocked, I help narrow the problem instead of taking the keyboard too early

That keeps this as learning by doing, not learning by watching.
