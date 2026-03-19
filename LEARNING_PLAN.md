# 🤖 AI Agents Learning Plan

**Goal:** Understand multi-agent patterns well enough to build your own project, and be able to evaluate agent quality rigorously.  
**Approach:** Run existing code → understand it → modify it → build something new.  
**Environment:** Python (comfortable), OpenAI key configured, new to LangGraph / LangChain / Autogen.

---

## 📌 Framework Decision (2025 Research)

The repo covers **LangGraph, LangChain, and Autogen** — these remain the right choices:

| Framework | Status (2025) | Best for |
|---|---|---|
| **LangGraph** ⭐ | Active, production-ready | Stateful, graph-based, complex workflows |
| **LangChain** | Active | General-purpose chaining, tool calls |
| **Autogen** | → Maintenance mode | Conversational multi-agent, learning patterns |
| OpenAI Agents SDK | New (March 2025) | Simple handoffs, replaces Swarm |

**Verdict:** LangGraph is the priority framework — most production-relevant. Autogen is still worth learning for multi-agent conversation patterns. OpenAI Agents SDK is worth a quick exercise in Phase 4.

---

## Phase 1 — Environment + Repo Architecture

**Checkpoint:** Everything runs, you understand how the repo is organized.

- [ ] Run `pytest -q` from repo root — all tests pass
- [ ] Read `src/common/evaluation/README_Evaluations.md`
- [ ] Read `src/common/scenarios/ecommerce_customer_support/spec.md`
- [ ] **Run** the LangGraph ecommerce agent manually (see README Usage §2)
- [ ] **Inspect** `src/frameworks/langgraph_agents/ecommerce_customer_support/implementation.py` line by line
- [ ] Can you explain the graph nodes and edges to yourself? ✋

> **Key concepts:** StateGraph, nodes, edges, conditional edges, state schema, tool-calling.

---

## Phase 2 — LangGraph Deep Dive ✅
**Checkpoint:** Build a tiny 3–4 node graph from scratch on a topic of your choice.

- [x] Read and run `src/frameworks/langgraph_agents/short_term_memory.py`
- [x] Read and run `src/frameworks/langgraph_agents/semantic_memory_langgraph.py`
- [x] Read `src/frameworks/langgraph_agents/reflexion.py` — understand the self-critique loop
- [ ] Inspect `src/frameworks/langgraph_agents/it_helpdesk/` — compare pattern to ecommerce
- [x] **Modify:** Add a new node to the ecommerce agent (e.g. a "loyalty points check" step)
- [x] **Build:** A minimal 3–4 node LangGraph from scratch (Verified via Phase 2.5 Evaluation)

> **Key concepts:** Memory types (short-term vs semantic), Reflexion pattern, subgraphs.

---

## Phase 3 — LangChain & Autogen: Same Problem, Different Frameworks

**Checkpoint:** Write 5 bullet points comparing the 3 frameworks — pick your favourite and justify it.

- [ ] Run `src/frameworks/langchain/scenarios/ecommerce_customer_support/implementation.py`
- [ ] Side-by-side comparison: LangGraph vs LangChain for the same scenario
- [ ] Run `src/frameworks/autogen_agents/scenarios/ecommerce_customer_support/implementation.py`
- [ ] Understand Autogen's conversational multi-agent handoff pattern
- [ ] **Modify:** Change the Autogen agent's system prompt and observe behaviour shifts
- [ ] Explore `src/frameworks/langgraph_agents/experiential_learning.py`

> **Key concepts:** Chain vs graph vs conversation paradigm, agent handoff, system prompts.

---

## Phase 4 — Tools, MCP & Multi-Agent Communication

**Checkpoint:** Add a new MCP-compatible tool (e.g. a currency converter) to the math server.

- [ ] Read `src/frameworks/langgraph_agents/langgraph_tool.py` — how tools are registered
- [ ] Read `src/common/mcp/MCP_math_server.py` and `MCP_weather_server.py`
- [ ] Read `src/frameworks/langgraph_agents/langgraph_mcp_client.py` — connect agent to MCP tool
- [ ] Read `src/common/a2a/agent_server.py` and `agent_client.py` — agent-to-agent communication
- [ ] **Bonus:** Try the OpenAI Agents SDK (`pip install openai-agents`) — build a 2-agent handoff for the ecommerce scenario and compare to LangGraph
- [ ] **Modify:** Add a new tool to the MCP math server ✋

> **Key concepts:** Tool registration, MCP protocol, A2A communication, agent handoff.

---

## Phase 5 — Evaluation Mastery

**Checkpoint:** Can you write a full eval set for a brand-new scenario (just JSON, no agent yet)?

- [ ] Read `src/common/evaluation/ai_judge.py` — the LLM-as-judge pattern
- [ ] Read `src/common/evaluation/metrics.py` and `memory_evaluation.py`
- [ ] Read `src/common/evaluation/batch_evaluation.py` — the eval harness
- [ ] Run the batch evaluation against the ecommerce eval set (see README Usage §1)
- [ ] Inspect `src/common/scenarios/ecommerce_customer_support/evaluation/ecommerce_customer_support_evaluation_set.json`
- [ ] Run `tests/evaluation/test_ai_judge.py` and `test_memory_evaluation.py`
- [ ] Read `src/common/evaluation/distribution_shifts.py`
- [ ] **Modify:** Add 3 new eval examples to the eval set and re-run ✋

> **Key concepts:** LLM-as-judge, gold datasets, batch evaluation, semantic similarity, distribution shift.

---

## Phase 6 — Domain Scenarios + Drafting Your Own

**Checkpoint:** A `spec.md` draft for a new scenario of your own choosing.

- [ ] Explore all LangGraph scenario folders: `financial_services/`, `healthcare/`, `legal/`, `soc/`, `supply_chain/`
- [ ] Pick **one** domain — read its implementation thoroughly
- [ ] Read `src/common/graph_rag.py` — GraphRAG for knowledge-intensive agents
- [ ] **Modify:** Extend the chosen scenario (add a new capability or edge-case handler)
- [ ] **Draft:** Write a `spec.md` for a new scenario in plain English ✋

---

## Phase 7 — Build Something New (Capstone)

**Checkpoint:** Your agent passes >70% of its own eval set on the first run — add observability.

- [ ] Read `src/common/observability/loki_logger.py` and `instrument_tempo.py`
- [ ] Run `tests/observability/test_loki_logger.py`
- [ ] **Build:**
  - At least 3 nodes
  - At least 1 tool call
  - Eval set with 3–5 examples
  - Logging with `log_to_loki` or OTel spans
  - Run through the batch evaluator ✋

---

## 🧠 Patterns to Internalize

| Pattern | What it is |
|---|---|
| **ReAct** | Reason + Act loop — core of most tool-using agents |
| **Reflexion** | Self-critique and retry loop |
| **Supervisor** | Orchestrator delegating to specialist sub-agents |
| **LLM-as-Judge** | Using an LLM to score another LLM's outputs |
| **Memory types** | Short-term (in-context), long-term (semantic/vector), episodic |
| **MCP** | Model Context Protocol for standardised tool access |
| **A2A** | Agent-to-Agent communication protocol |

---

## 🔑 Key Files Reference

| File | Why it matters |
|---|---|
| `langgraph_agents/ecommerce_customer_support/implementation.py` | Best LangGraph reference |
| `common/evaluation/ai_judge.py` | Core evaluation pattern |
| `common/evaluation/batch_evaluation.py` | Running evals at scale |
| `langgraph_agents/reflexion.py` | Self-improvement pattern |
| `common/mcp/MCP_math_server.py` | Tool server pattern |
| `common/a2a/agent_server.py` | Multi-agent communication |
| `common/graph_rag.py` | Knowledge-augmented agents |
