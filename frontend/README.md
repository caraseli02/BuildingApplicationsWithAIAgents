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
- a scaffolded `mcp-weather` page and Nuxt server route for battle-testing MCP from the app side

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

## MCP Weather Sandbox

The frontend now includes two MCP learning surfaces:

- page: `app/pages/mcp-weather.vue`
- route: `server/api/mcp/weather.post.ts`
- server utility: `server/utils/mcp/weather-client.ts`
- Apps SDK widget server: `mcp-apps/weather-app-server.mjs`
- Apps SDK widget template: `mcp-apps/weather-widget.html`

What is already set up:

- the page form and result UI
- the Nuxt server route boundary
- config for the MCP weather server URL
- official docs links returned by the route
- the official TypeScript MCP SDK added to `package.json`

Recommended implementation references:

- LangChain MCP docs: [docs.langchain.com/oss/python/langchain/mcp](https://docs.langchain.com/oss/python/langchain/mcp)
- Model Context Protocol TypeScript SDK: [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- MCP specification: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- OpenAI Apps SDK quickstart: [developers.openai.com/apps-sdk/quickstart](https://developers.openai.com/apps-sdk/quickstart)
- Build your MCP server: [developers.openai.com/apps-sdk/build/mcp-server](https://developers.openai.com/apps-sdk/build/mcp-server)
- Build your ChatGPT UI: [developers.openai.com/apps-sdk/build/chatgpt-ui](https://developers.openai.com/apps-sdk/build/chatgpt-ui)

Suggested setup:

1. From the repo root, run the weather server:

```bash
source venv/bin/activate
python src/common/mcp/MCP_weather_server.py
```

2. In `frontend/`, install dependencies:

```bash
npm install
```

3. Start the Nuxt dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000/mcp-weather`

Optional environment variable:

```bash
MCP_WEATHER_URL=http://127.0.0.1:8000/mcp
```

## MCP Apps Weather Widget

The repo now also includes a minimal ChatGPT-visible Apps SDK example:

```bash
npm run mcp:weather-app
```

That starts a separate MCP server on `http://localhost:8787/mcp` that:

- registers a tool called `show_weather_widget`
- registers an HTML widget resource with the MCP Apps MIME type
- returns `structuredContent` that the widget can render inside ChatGPT

Full guide:

- [docs/mcp-apps-weather.md](../docs/mcp-apps-weather.md)

Important distinction:

- `mcp-weather.vue` is your own Nuxt page
- the Apps SDK weather widget is an iframe rendered by ChatGPT after a tool call

## Tests

Run the frontend test suite:

```bash
npm test
```

Build the app for production verification:

```bash
npm run build
```
