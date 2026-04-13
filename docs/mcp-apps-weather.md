# MCP Apps Weather Widget

This is the first repo-local example of a **ChatGPT-visible MCP Apps widget**, separate from the existing Nuxt sandbox.

Files:

- server: [`frontend/mcp-apps/weather-app-server.mjs`](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-app-server.mjs)
- widget HTML: [`frontend/mcp-apps/weather-widget.html`](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-widget.html)

## What this example is for

Use this when you want to understand how an MCP tool becomes a **visible UI card inside ChatGPT**.

This is not the same thing as the Nuxt sandbox:

- Nuxt sandbox: your own app page calls an MCP server and renders the result locally.
- MCP Apps widget: ChatGPT calls your MCP tool, then ChatGPT loads your HTML template in an iframe and renders the tool result inside the chat experience.

## Official references

- OpenAI Apps SDK quickstart: [developers.openai.com/apps-sdk/quickstart](https://developers.openai.com/apps-sdk/quickstart)
- Build your MCP server: [developers.openai.com/apps-sdk/build/mcp-server](https://developers.openai.com/apps-sdk/build/mcp-server)
- Build your ChatGPT UI: [developers.openai.com/apps-sdk/build/chatgpt-ui](https://developers.openai.com/apps-sdk/build/chatgpt-ui)
- Official Apps SDK examples: [github.com/openai/openai-apps-sdk-examples](https://github.com/openai/openai-apps-sdk-examples)
- TypeScript SDK: [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)

## How the UI actually appears

The visible UI only appears when all four pieces line up:

1. The MCP server registers a **resource** with the Apps UI MIME type `text/html;profile=mcp-app`.
2. The tool descriptor points at that resource via:
   - `_meta.ui.resourceUri`
   - `_meta["openai/outputTemplate"]`
3. The tool returns `structuredContent`.
4. ChatGPT is connected to the server and decides to call the tool.

When that happens:

1. ChatGPT calls the tool.
2. Your server returns text plus `structuredContent`.
3. ChatGPT loads the HTML template in an iframe.
4. ChatGPT passes the tool result into the iframe.
5. The widget renders from that structured data.

That is why a normal MCP server is not enough for visible UI. You need both:

- a tool
- a registered widget resource

## Local setup

From [`frontend`](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend):

```bash
npm install
npm run mcp:weather-app
```

Expected output:

```text
Weather visual MCP server listening on http://localhost:8787/mcp
```

You can sanity-check the server with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest --server-url http://localhost:8787/mcp --transport http
```

Use Inspector to verify:

- the tool `show_weather_widget` exists
- the server returns `structuredContent`

Inspector is useful for tool validation. The **real widget UI** is meant to appear in ChatGPT.

## Make the widget appear in ChatGPT

To see the visual UI inside ChatGPT:

1. Run the server locally:

```bash
cd frontend
npm run mcp:weather-app
```

2. Expose it over HTTPS, for example with ngrok:

```bash
ngrok http 8787
```

3. Copy the public HTTPS URL and append `/mcp`.

Example:

```text
https://your-subdomain.ngrok.app/mcp
```

4. In ChatGPT:
   - enable Developer Mode under Settings → Apps & Connectors → Advanced settings
   - create a new connector
   - paste the public HTTPS MCP URL
   - name it and save it

5. Open a new chat, add the connector, and prompt something like:

```text
Show me the weather widget for Madrid.
```

If ChatGPT decides to call the tool, the card from [`weather-widget.html`](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-widget.html) should render inline in the chat.

## If the UI does not appear

Work through these in order:

1. Confirm the connector points to the HTTPS URL with `/mcp`, not the site root.
2. Refresh the connector after changing tool metadata or resource metadata.
3. Prompt for the widget explicitly, for example:

```text
Use the show_weather_widget tool and show me the weather widget for Madrid.
```

4. If ChatGPT only narrates text, inspect the tool in your connector settings and confirm it still exposes:
   - `_meta.ui.resourceUri`
   - `_meta["openai/outputTemplate"]`
5. If the connector fails entirely, verify locally with MCP Inspector before retrying ChatGPT.

## What to edit next

If you want to keep iterating on this example:

- edit the fixture data in [`frontend/mcp-apps/weather-app-server.mjs`](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-app-server.mjs)
- edit the visual layout in [`frontend/mcp-apps/weather-widget.html`](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-widget.html)
- refresh the connector in ChatGPT after changing tool metadata

## Recommended next improvement

This is a single-tool render example for learning.

If you want a more production-like pattern, split it into:

- one data tool that only returns weather data
- one render tool that only owns the widget

That matches the decoupled pattern recommended in the Apps SDK docs and makes re-render behavior easier to control.
