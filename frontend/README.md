# Agent Run Explorer Frontend

This Nuxt app is the first frontend surface for the repo. It is intentionally narrow:

- one scenario: `ecommerce_customer_support`
- one primary job: trigger a run and inspect it
- one main view: a timeline where tool calls are the strongest visual signal

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

## Tests

Run the frontend test suite:

```bash
npm test
```

Build the app for production verification:

```bash
npm run build
```
