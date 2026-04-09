# Start Here

This repo has been reset to a clean baseline and the Chapter 0 startup path has already been verified.

Current handoff:

- Chapter 0 is done
- Chapter 1 has started
- first code change is done in `customer_support_agent.py`
- baseline test command passed locally

Begin from the **Next Step** section below, then continue with [LEARNING_PLAN.md](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/LEARNING_PLAN.md).

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

- [customer_support_agent.py](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/ecommerce_customer_support/customer_support_agent.py)
- [short_term_memory.py](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/src/frameworks/langgraph_agents/short_term_memory.py)

Resume from here:

- Chapter 1 understanding is complete enough to move on
- the first exercise changed unknown loyalty points from `"unknown"` to `"0"`
- the framework test passed after that change
- the next learning step is Chapter 2, starting with `short_term_memory.py`

## Important Note

Do not use full `pytest -q` as the first success gate. The day-1 goal is a clean repo plus the targeted baseline checks from Chapter 0.

Also note:

- editable install works from the repo root with `pip install -e .`
- test tooling is not included in the base dependency files, so install `pytest` explicitly in Chapter 0
- the targeted baseline tests only need an API key-shaped value, so a placeholder `OPENAI_API_KEY` is fine if you are not making live API calls yet

## How We Work

- you run the step
- you show me what happened
- I help you reason through it and choose the next move

That keeps this project focused on learning by doing.
