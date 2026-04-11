# Building Applications with AI Agents

[Overview](#overview) • [Book](#book) • [Features](#features) • [Installation](#installation) • [Usage](#usage) • [Directory Structure](#directory-structure) • [Examples](#examples) • [Testing](#testing) • [Contributing](#contributing) • [License](#license)

---

## Overview

This repository provides a **unified, multi-framework platform** for designing, implementing, and evaluating AI-powered agents. By separating **scenario definitions** from **framework-specific code**, we enable:

* A **single evaluation dataset** for each scenario (under `src/common/evaluation/scenarios/`).
* **Parallel implementations** in LangGraph, LangChain, Autogen (and more).
* A **shared evaluation harness** to compare outputs across frameworks.
* **Built-in observability** (Loki logging & OpenTelemetry/Tempo).
* **Unit tests** for core utilities and telemetry setup.

Whether you’re building an e-commerce support bot, an IT support desk assistant, a voice agent, or anything in between, this codebase helps you scale from prototype to production coverage—while maintaining consistency and reusability.

---

## Book

This repository accompanies the O’Reilly Media book
[**Building Applications with AI Agents: Designing and Implementing Multi-Agent Systems**](https://www.oreilly.com/library/view/building-applications-with/9781098176495/).
All scenarios, architectural patterns, and observability examples reflect the lessons and code samples from the book. Feel free to follow along chapter by chapter or dive straight into the code!

<div align="center">
  <a href="https://www.oreilly.com/library/view/building-applications-with/9781098176495/">
    <img src="resources/book_cover.jpeg" alt="Building Applications with AI (O’Reilly)">
  </a>
</div>

---

## Features

* **Shared Scenario Datasets**
  Each scenario ships with reusable JSONL evaluation data under:

  * `src/common/evaluation/scenarios/`
  * one file per domain, for example `ecommerce_customer_support_evaluation_set.jsonl`

* **Multi-Framework Implementations**
  Implement each scenario in parallel under:

  * `src/frameworks/langgraph_agents/`
  * `src/frameworks/langchain/`
  * `src/frameworks/autogen_agents/`
    *(Easily add more frameworks by following the same folder patterns.)*

* **Built-In Observability**

  * **Loki Logger**:
    `src/common/observability/loki_logger.py` posts structured logs to a local Loki endpoint.
  * **OpenTelemetry / Tempo**:
    `src/common/observability/instrument_tempo.py` sets up an OTLP exporter and instruments spans (parent & child) to Tempo.

* **Unit Tests for Core Utilities & Telemetry**

  * Tests for evaluation utilities:
    `tests/evaluation/test_ai_judge.py` & `test_memory_evaluation.py`
  * Tests for observability code (monkeypatching exporters):
    `tests/observability/test_loki_logger.py` & `test_instrument_tempo.py`

---

## Installation

1. **Clone the Repo**

   ```bash
   git clone https://github.com/your-org/agents.git
   cd agents
   ```

2. **Create a Conda (or Virtualenv) Environment**

   ```bash
   # Using Conda
   conda env create -f environment.yml
   conda activate agents
   ```

3. **Install Python Dependencies and Local Package**

   ```bash
   pip install -r requirements.txt
   pip install -e .
   pip install pytest pytest-asyncio pytest-mock
   ```

   * `pip install -e .` ensures that modules under `src/` (for example `common.*` and `frameworks.*`) are importable.

---

## Usage

### 0. Preferred Visual Workflow: LangSmith Studio

If your goal is to understand what the agent is doing step by step, use LangSmith Studio instead of the custom Nuxt explorer.

Studio is now the primary visual inspection workflow for this repo because it can already show:

- prompts sent to the model
- tool calls and results
- intermediate execution state
- final output and debugging context

Quick start:

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

Full setup guide: [docs/langsmith-studio.md](docs/langsmith-studio.md)

### 1. Running a Scenario Evaluation

Use the shared batch evaluator from the repo root:

```bash
OPENAI_API_KEY=your_key_here python -m src.common.evaluation.batch_evaluation \
  --dataset src/common/evaluation/scenarios/ecommerce_customer_support_evaluation_set.jsonl \
  --graph_py src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py
```


### 2. Launching a Single Framework Agent

If you want to manually run the LangGraph version of the e-commerce agent:

```bash
python - << 'PYCODE'
from frameworks.langgraph_agents.ecommerce_customer_support.customer_support_agent import graph
from langchain_core.messages import HumanMessage

result = graph.invoke({
  "order": {
    "order_id": "A12345",
    "status": "Delivered",
    "total": 19.99,
    "customer_id": "CUST123"
  },
  "messages": [HumanMessage(content="My mug arrived broken. Refund?")]
})

for message in result["messages"]:
  print(type(message).__name__, message.content)
PYCODE
```

Set `OPENAI_API_KEY` before running live agent examples.

### 3. Optional Custom Frontend Sandbox

The Vue/Nuxt app under [frontend/README.md](frontend/README.md) is preserved as an optional sandbox for future repo-specific interfaces.

It is no longer the recommended way to inspect agent behavior.

### 4. Observability

* **Loki Logging**
  Any call to `log_to_loki(label, message)` in your code sends a JSON payload to:

  ```
  http://localhost:3100/loki/api/v1/push
  ```

  Point Grafana/Loki at that endpoint to view logs in real time.

* **OpenTelemetry / Tempo**

  ```python
  from common.observability.instrument_tempo import do_work
  do_work()  # Emits a parent span and three child spans to the OTLP endpoint (localhost:3200)
  ```

  To instrument your own functions, import `tracer = common.observability.instrument_tempo.tracer` and wrap code in `with tracer.start_as_current_span("span-name"):` blocks.

---

## Directory Structure

Here’s a bird’s-eye view of how everything is organized:

```
agents/
├── .gitignore
├── README.md
├── environment.yml
├── package.json
├── requirements.txt
├── conftest.py                 # Ensures src/ is on PYTHONPATH for pytest
│
├── resources/                  # Static assets (e.g., book cover)
│   └── book_cover.jpeg
│
├── src/
│   ├── common/                 # Framework-agnostic modules
│   │   ├── evaluation/         # AIJudge, memory_evaluation, metrics
│   │   │   ├── ai_judge.py
│   │   │   ├── batch_evaluation.py
│   │   │   ├── memory_evaluation.py
│   │   │   └── metrics.py
│   │   │
│   │   ├── observability/      # Loki + OpenTelemetry helpers
│   │   │   ├── loki_logger.py
│   │   │   └── instrument_tempo.py
│   │   │
│   │   └── evaluation/         # AIJudge, memory evaluation, metrics, datasets
│   │       ├── ai_judge.py
│   │       ├── batch_evaluation.py
│   │       ├── memory_evaluation.py
│   │       ├── metrics.py
│   │       └── scenarios/
│   │           ├── ecommerce_customer_support_evaluation_set.jsonl
│   │           ├── healthcare_patient_intake_and_triage.jsonl
│   │           └── ...
│   │
│   └── frameworks/             # One folder per agent framework
│       ├── autogen_agents/
│       │   ├── calculator_tool_use.py
│       │   ├── autogen_mcp_client.py
│       │   └── web_surfer_agent.py
│       │
│       ├── langchain/
│       │   ├── calculator_tool_use.py
│       │   ├── hierarchical_skill_selection.py
│       │   └── semantic_skill_selection.py
│       │
│       └── langgraph_agents/
│           ├── ecommerce_customer_support/
│           │   ├── customer_support_agent.py
│           │   └── customer_support_agent_with_traceloop.py
│           ├── short_term_memory.py
│           ├── semantic_memory_langgraph.py
│           └── ...
│
└── tests/                      # Unit tests (pytest)
    ├── evaluation/
    │   ├── test_ai_judge.py
    │   └── test_memory_evaluation.py
    │
    └── observability/
        ├── test_loki_logger.py
        └── test_instrument_tempo.py
```

---

## Examples

### 1. Running a LangChain Agent (Ecommerce Support)

```bash
OPENAI_API_KEY=your_key_here python src/frameworks/langchain/calculator_tool_use.py
```

### 2. Running a LangGraph Agent (Ecommerce Support)

```bash
python - << 'PYCODE'
from frameworks.langgraph_agents.ecommerce_customer_support.customer_support_agent import graph
from langchain_core.messages import HumanMessage

result = graph.invoke({
  "order": {
    "order_id": "A12345",
    "status": "Delivered",
    "total": 19.99,
    "customer_id": "CUST123"
  },
  "messages": [HumanMessage(content="My mug arrived broken. Refund?")]
})
print(result)
PYCODE
```

---

## Testing

We use **pytest** for all unit tests:

* **Evaluation utilities tests**:

  * `tests/evaluation/test_ai_judge.py`
  * `tests/evaluation/test_memory_evaluation.py`

* **Observability tests**:

  * `tests/observability/test_loki_logger.py`
  * `tests/observability/test_instrument_tempo.py`

To run the startup-safe baseline:

```bash
OPENAI_API_KEY=${OPENAI_API_KEY:-dummy} pytest tests/evaluation tests/observability tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py -q
```

Do not use full `pytest -q` as the first success gate. Some optional or heavy-dependency paths are intentionally outside the default startup workflow.

---

## Contributing

We welcome contributions! To add a new scenario or framework, follow these steps:

1. **Add a new scenario spec**

   * Add a new JSONL dataset under `src/common/evaluation/scenarios/`.
   * Document the scenario and its expected tool behavior in the relevant learning or project docs.

2. **Implement the scenario in each framework**

   * LangGraph: `src/frameworks/langgraph_agents/<your_scenario>/...`
   * LangChain: `src/frameworks/langchain/...`
   * Autogen: `src/frameworks/autogen_agents/...`
   * (Follow the same pattern for any new framework.)

3. **Write or update tests**

   * If you add new utilities under `common/` or `observability/`, include tests under `tests/evaluation/` or `tests/observability/`.
   * For a new scenario, you can add a quick smoke test under `tests/scenarios/<your_scenario>/test_spec_consistency.py` to verify all frameworks produce at least valid JSON output.

4. **Submit a Pull Request**

   * Verify the relevant targeted tests pass.
   * Update this `README.md` if you introduce new high-level functionality or folders.
