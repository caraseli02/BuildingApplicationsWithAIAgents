# Start Here

This repo has been reset to a clean baseline so you can restart the book project from zero.

Begin with **Chapter 0** in [LEARNING_PLAN.md](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/LEARNING_PLAN.md).

## First Commands

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
