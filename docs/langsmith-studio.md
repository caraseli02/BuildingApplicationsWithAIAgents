# LangSmith Studio Workflow

LangSmith Studio is the primary visual workflow for inspecting agents in this repo.

Use it when you want to:

- see prompts, tool calls, outputs, and final replies in one interface
- inspect agent steps without maintaining a custom frontend
- debug LangGraph behavior locally while keeping the repo focused on Python examples

The custom Nuxt app under [frontend/README.md](../frontend/README.md) is still preserved, but it is now an optional sandbox rather than the recommended way to learn what the agent is doing.

## Prerequisites

LangChain’s current Studio docs require:

- Python 3.11 or newer
- a LangSmith account and API key
- the LangGraph CLI

Primary references:

- [LangSmith Studio](https://docs.langchain.com/oss/python/langgraph/studio)
- [Local Agent Server](https://docs.langchain.com/oss/python/langgraph/local-server)

## Setup

From the repo root:

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -e ".[studio]"
```

The `studio` extra is the supported way to install the local Agent Server toolchain. It keeps the Studio workflow in package metadata instead of relying on a `--no-deps` workaround.

Create a local environment file from the example:

```bash
cp .env.example .env
```

Then set:

- `OPENAI_API_KEY`
- `LANGSMITH_API_KEY`

If you want Studio connected to the local agent server without sending traces to LangSmith, keep:

```bash
LANGSMITH_TRACING=false
```

Per LangChain’s docs, with tracing disabled no data leaves your local server.

## Agent Server

This repo now includes a root [langgraph.json](../langgraph.json) pointing Studio at both the ecommerce customer support graph and the short-term memory learning example:

```json
{
  "dependencies": ["."],
  "graphs": {
    "ecommerce_support": "./src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py:graph",
    "short_term_memory": "./src/frameworks/langgraph_agents/short_term_memory.py:graph"
  },
  "env": ".env"
}
```

Start the local Agent Server:

```bash
langgraph dev
```

When the server is running, the local API should be available at:

```text
http://127.0.0.1:2024
```

And Studio can connect at:

```text
https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
```

If Safari blocks localhost connections to Studio, LangChain’s docs recommend using `langgraph dev --tunnel` and then manually adding the tunnel URL in Studio.

## Recommended First Run

Start with the ecommerce support graph and a refund or cancellation prompt, for example:

- `"My mug arrived broken. Refund?"`
- `"Please cancel my order, I don't need it anymore."`

Useful order payload:

```json
{
  "order_id": "A12345",
  "status": "Delivered",
  "total": 19.99,
  "customer_id": "CUST123"
}
```

In Studio, inspect:

- the prompt sent to the model
- the first business tool call
- the follow-up `send_customer_message` call
- the final assistant reply

## Additional Learning Run

You can also select the `short_term_memory` graph in Studio to see checkpointed memory with the same visual tooling.

Recommended flow:

1. Start a thread with: `hi! I'm bob`
2. Reuse the same thread and send: `what's my name?`

What to inspect:

- both runs stay attached to the same thread
- the graph itself is still a single `call_model` node
- the remembered context comes from the LangGraph server's built-in thread persistence in Studio, not from a more complex graph shape

Note: the CLI demo in `short_term_memory.py` still uses `MemorySaver()` to teach the concept explicitly, but the Studio-exported graph must stay free of a custom checkpointer because LangGraph API manages persistence itself.

## Troubleshooting

- If `frameworks` or `common` imports fail, make sure you ran `pip install -e .` from the repo root.
- If `langgraph dev` is missing, recreate the virtualenv and reinstall with `pip install -e ".[studio]"`.
- If `langgraph dev` cannot find the graph, check that you started it from the repo root where `langgraph.json` lives.
- If the model path fails, verify `OPENAI_API_KEY`.
- If Studio cannot connect, verify `LANGSMITH_API_KEY` and that `langgraph dev` is serving on `127.0.0.1:2024`.

## What Changed

This repo previously added a custom Nuxt run explorer to visualize one agent flow. That app is still available for future repo-specific interfaces, but Studio now replaces it as the main visual inspection path because it already provides the graph execution, thread inspection, prompt/tool visibility, and debugging features that the custom UI would otherwise need to rebuild.
