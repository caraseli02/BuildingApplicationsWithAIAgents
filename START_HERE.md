# Start Here

This repo has been reset to a clean baseline and the Chapter 0 startup path has already been verified.

Current handoff:

- Chapter 0 is done
- Chapter 1 is complete enough to move on
- Chapter 2 is complete enough to move on
- Chapter 3 is complete enough to move on
- Chapter 4 is complete enough to move on
- current extension: Nuxt MCP weather sandbox scaffold is in place
- baseline test command passed locally

Begin from the **Next Step** section below, then continue with [LEARNING_PLAN.md](LEARNING_PLAN.md).

## Verified Baseline

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

Additional verified framework smoke test:

```bash
./venv/bin/pytest tests/frameworks/langgraph_agents/test_langgraph_customer_support_agent.py -q
```

## Next Step

Open:

- [mcp-weather.vue](frontend/app/pages/mcp-weather.vue)
- [weather.post.ts](frontend/server/api/mcp/weather.post.ts)
- [weather-client.ts](frontend/server/utils/mcp/weather-client.ts)
- [frontend README](frontend/README.md)

Resume from here:

- the next learning step is to implement the Nuxt-side MCP weather client
- the server route and page already exist; only the MCP client code is intentionally missing
- follow the comments and docs links in `frontend/server/utils/mcp/weather-client.ts`
- battle-test the result against the live FastMCP weather server

## Companion Resources

Use these after you have run the repo examples first:

- [LEARNING_PLAN.md](LEARNING_PLAN.md)
- [LangChain MCP](https://docs.langchain.com/oss/python/langchain/mcp)
- [LangChain multi-agent](https://docs.langchain.com/oss/python/langchain/multi-agent)
- [LangChain Academy](https://academy.langchain.com/)

## Optional Visual Debugging

LangSmith Studio is optional support, not the default learning path. Use it when you already understand the CLI/code path and want a visual trace.

```bash
source venv/bin/activate
pip install -e ".[studio]"
langgraph dev
```

```text
https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
```

Guide: [docs/langsmith-studio.md](docs/langsmith-studio.md)

Available Studio graphs right now:

- `ecommerce_support`
- `short_term_memory`

## Important Note

Do not use full `pytest -q` as the first success gate. The day-1 goal is a clean repo plus the targeted baseline checks from Chapter 0.

Also note:

- editable install works from the repo root with `pip install -e .`
- test tooling is not included in the base dependency files, so install `pytest` explicitly in Chapter 0
- the targeted baseline tests only need an API key-shaped value, so a placeholder `OPENAI_API_KEY` is fine if you are not making live API calls yet
- the custom Nuxt app is preserved for future repo-specific interfaces
- LangSmith Studio is optional support, not the core learning route

## How We Work

- you run the step
- you show me what happened
- I help you reason through it and choose the next move

That keeps this project focused on learning by doing.
