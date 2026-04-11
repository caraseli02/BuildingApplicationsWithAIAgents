# Agent Run Explorer Frontend

This Nuxt app is preserved as an optional sandbox for future repo-specific interfaces.

It is no longer the primary visual workflow for learning what agents are doing. That role now belongs to LangSmith Studio:

- Studio setup: [docs/langsmith-studio.md](../docs/langsmith-studio.md)
- Local Agent Server entrypoint: [langgraph.json](../langgraph.json)

Use this frontend only if you specifically want to explore custom Vue/Nuxt surfaces for the repo.

## What Still Exists Here

The app still includes:

- one scenario: `ecommerce_customer_support`
- local trigger-and-inspect flows
- chat/timeline presentation experiments

Those are now considered custom product experiments rather than the default debugging path.

## How to Run

Install dependencies:

```bash
npm install
```

Start the dev server from the `frontend/` directory:

```bash
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Execution Modes

The launcher supports two modes:

- `Auto`
  Tries to call the real Python adapter and return a normalized run record.
- `Mock`
  Skips the Python flow and returns a demo run payload so the UI stays usable when the local model environment is not ready.

## Real Run Requirements

`Auto` mode shells out to:

```bash
python3 -m common.frontend.run_explorer_cli
```

That means the repo's Python dependencies need to be installed, and live model execution may still require `OPENAI_API_KEY`.

If the live path fails, the UI returns a structured failed run instead of crashing the screen.

## Recommended Default Instead

If you want the best visual learning path for this repo, use LangSmith Studio instead:

```bash
python3 -m venv ../venv
source ../venv/bin/activate
pip install --upgrade pip
cd ..
pip install -e ".[studio]"
cp .env.example .env
langgraph dev
```

Then open:

```text
https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024
```

## Tests

Run the frontend test suite:

```bash
npm test
```

Build the app for production verification:

```bash
npm run build
```
