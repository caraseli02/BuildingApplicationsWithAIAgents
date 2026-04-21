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

This repo now includes a root [langgraph.json](../langgraph.json) pointing Studio at the main learning graphs:

```json
{
  "dependencies": ["."],
  "graphs": {
    "ecommerce_support": "./src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py:graph",
    "short_term_memory": "./src/frameworks/langgraph_agents/short_term_memory.py:graph",
    "reflexion": "./src/frameworks/langgraph_agents/reflexion.py:graph",
    "supply_chain_single": "./src/frameworks/langgraph_agents/supply_chain/supply_chain_logistics_agent.py:graph",
    "supply_chain_multi": "./src/frameworks/langgraph_agents/supply_chain/supply_chain_logistics_multi_agent.py:graph"
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

## Chapter 5 Comparison Run

For the single-agent vs multi-agent logistics comparison, Studio now exposes:

- `supply_chain_single`
- `supply_chain_multi`

Use the same input for both so the graph shape difference is obvious.

Recommended operation payload:

```json
{
  "operation_id": "OP-12345",
  "type": "inventory_management",
  "priority": "high",
  "location": "Warehouse A"
}
```

Recommended user prompt:

- `"We're running critically low on SKU-12345. Current stock is 50 units but we have 200 units on backorder. What's our reorder strategy?"`

What to inspect in `supply_chain_single`:

- one `assistant` node handles both reasoning and tool use
- tool calls happen inside that single node
- there is no explicit routing node before execution

What to inspect in `supply_chain_multi`:

- `supervisor` runs first
- Studio then branches into one specialist node such as `inventory`
- the selected specialist performs tool calls after routing is already decided

Best comparison prompt after the inventory run:

- `"A cold-chain shipment from Valencia is delayed and one container may have spoiled. What should we do next?"`

That second prompt tends to route the multi-agent graph to `transportation`, which makes the supervisor-specialist split easier to see visually.

## Reflexion Run

Studio also exposes the `reflexion` graph so you can inspect a critique-and-improve flow before moving on to heavier multi-agent orchestration.

Recommended input:

```json
{
  "messages": [
    {
      "type": "human",
      "content": "You will be given the history of a past experience in which you were placed in an environment and given a task to complete. You were unsuccessful in completing the task. Do not summarize your environment, but rather think about the strategy and path you took to attempt to complete the task. Devise a concise, new plan of action that accounts for your mistake with reference to specific actions that you should have taken. For example, if you tried A and B but forgot C, then devise a plan to achieve C with environment-specific actions. You will need this later when you are solving the same task. Your response must: start with \"Plan:\", include no more than 4 bullet points, mention the wrong product choice, mention the price constraint, include one concrete next search query.\n\nInstruction:\ni am looking for dairy free and apple variety pack of chips, and price lower than 30.00 dollars\n[Search]\n\nAction: search[dairy free and apple variety pack of chips]\nObservation:\n[Back to Search]\nPage 1 (Total results: 50)\n[Next >]\n[B07HRFJWP8]\nEnjoy Life Foods Soft Baked Ovals, Breakfast Bars, Nut Free Bars, Soy Free, Dairy Free, Non GMO, Gluten Free, Vegan, Variety Pack, 4 Boxes (20 Bars Total)\n$100.0\n[B01KMHY5PG]\nEnjoy Life Soft Baked Chewy Bars, Variety Pack, Nut Free Bars, Soy Free, Dairy Free, Gluten Free, 6 Boxes (30 Total Bars)\n$21.49\n[B008D2X8C4]\nEnjoy Life Lentil Chips Variety Pack, Dairy Free Chips, Soy Free, Nut Free, Non GMO, Vegan, Gluten Free, 24 Bags (0.8 oz)\n$100.0\n\nAction: think[The first two items are not what I want. The third item is the dairy free and apple variety pack of chips I want.]\nObservation: OK.\n\nAction: click[B008D2X8C4]\nObservation:\n[Back to Search]\n[< Prev]\nflavor name [dill and sour cream][garlic & parmesan][light sea salt][margherita pizza][thai chili lime][variety pack]\nsize [0.8 ounce (pack of 24)][4 ounce (pack of 12)]\nPrice: $100.0\nRating: N.A.\n[Description]\n[Features]\n[Reviews]\n[Buy Now]\n\nAction: think[The item has options 'variety pack' and '0.8 ounce (pack of 24)' and seems good to buy.]\nObservation: OK.\n\nAction: click[variety pack]\nObservation: You have clicked variety pack.\n\nAction: click[0.8 ounce (pack of 24)]\nObservation: You have clicked 0.8 ounce (pack of 24).\n\nAction: click[Buy Now]\n\nSTATUS: FAIL\n\nPlan:\n"
    }
  ]
}
```

What to inspect:

- the graph shape is still just one `reflexion` node
- the multi-step behavior is coming from the prompt asking for critique and repair, not from multiple routing nodes
- this is different from `supply_chain_multi`, where the graph shape itself encodes role assignment

## Troubleshooting

- If `frameworks` or `common` imports fail, make sure you ran `pip install -e .` from the repo root.
- If `langgraph dev` is missing, recreate the virtualenv and reinstall with `pip install -e ".[studio]"`.
- If `langgraph dev` cannot find the graph, check that you started it from the repo root where `langgraph.json` lives.
- If the model path fails, verify `OPENAI_API_KEY`.
- If Studio cannot connect, verify `LANGSMITH_API_KEY` and that `langgraph dev` is serving on `127.0.0.1:2024`.

## What Changed

This repo previously added a custom Nuxt run explorer to visualize one agent flow. That app is still available for future repo-specific interfaces, but Studio now replaces it as the main visual inspection path because it already provides the graph execution, thread inspection, prompt/tool visibility, and debugging features that the custom UI would otherwise need to rebuild.
