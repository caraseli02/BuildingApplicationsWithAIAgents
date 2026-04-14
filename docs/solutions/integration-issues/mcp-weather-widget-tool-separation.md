---
module: Frontend
date: 2026-04-14
problem_type: integration_issue
component: mcp_apps_weather_widget
symptoms:
  - "The MCP weather example could return tool output, but the custom weather card did not reliably appear inside ChatGPT"
  - "Generic weather prompts were often satisfied by built-in ChatGPT capabilities instead of the connector tool"
  - "Tool/data wiring, widget rendering, and mock-provider concerns were mixed together, which made the learning path harder to reason about"
root_cause: missing_or_blurry_tool_contract_boundary
resolution_type: code_fix
severity: medium
tags:
  - mcp
  - apps-sdk
  - chatgpt-ui
  - widget
  - structured-content
  - frontend
---

# Troubleshooting: MCP Apps widget rendering needed a clean data-tool vs widget-tool split

## Problem

The MCP weather example evolved from a simple tool demo into a ChatGPT-visible widget, but the core boundaries were not initially explicit. It was possible to get text back from the server without being certain whether the connector, the widget resource, or the local rendering path was actually correct.

For a learning repo, that was the real problem: the example needed to teach the contract clearly, not just appear to work once.

## Environment

- Module: Frontend / MCP Apps
- Affected Components:
  - [frontend/mcp-apps/weather-app-server.mjs](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-app-server.mjs)
  - [frontend/mcp-apps/get_weather_data.mjs](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/get_weather_data.mjs)
  - [frontend/mcp-apps/weather-widget.html](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-widget.html)
  - [frontend/mcp-apps/weather-mock-data.json](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-mock-data.json)
  - [docs/mcp-apps-weather.md](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/docs/mcp-apps-weather.md)
- Date: 2026-04-14

## Symptoms

- The server could return tool output, but that alone did not prove the ChatGPT-visible widget path was correct.
- ChatGPT could answer weather questions with its own built-in capability, which masked whether the connector tool was actually being used.
- Changing city data, tool metadata, or widget HTML did not always produce the expected visible result until the local server and connector state were refreshed.
- The example originally taught “one tool that returns weather,” but that blurred two different ideas:
  - data capability
  - UI-bound capability

## What Didn't Work

**Attempted Solution 1:** Treat any successful tool response as proof that the widget integration was correct.  
- **Why it failed:** MCP text output and ChatGPT-visible UI are different success criteria. A tool can return text without ever causing ChatGPT to render the iframe widget.

**Attempted Solution 2:** Keep all weather logic, mock data, and widget behavior inside one server file.  
- **Why it failed:** It made the example harder to reason about and hid the useful separation between data normalization and UI presentation.

**Attempted Solution 3:** Use generic prompts like “show me the weather.”  
- **Why it failed:** ChatGPT could satisfy the request with built-in weather behavior instead of the connector tool, which made debugging misleading.

## Root Cause

The issue was a contract problem, not a CSS problem.

ChatGPT only renders the custom widget when all of these line up:

1. the server exposes a widget resource
2. the widget tool is explicitly marked as UI-bound through `_meta.ui.resourceUri`
3. the widget tool also points to the template via `_meta["openai/outputTemplate"]`
4. the tool returns `structuredContent`
5. ChatGPT actually chooses that tool instead of a built-in capability

When data loading, widget rendering, and provider-facing details were mixed together, the example could still “sort of work,” but it did not teach the MCP boundary clearly.

## Solution

The working fix was to split the MCP example into clear layers.

### 1. Create a data normalization boundary

Move all weather data loading behind one function in:

- [frontend/mcp-apps/get_weather_data.mjs](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/get_weather_data.mjs)

That module:

- loads city data from [frontend/mcp-apps/weather-mock-data.json](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-mock-data.json)
- normalizes the fallback shape
- guarantees a stable payload for the rest of the system

This keeps provider-specific logic out of the widget and out of the tool-registration code.

### 2. Expose two separate MCP tools

In [frontend/mcp-apps/weather-app-server.mjs](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-app-server.mjs), expose:

- `get_weather_data`
- `display_weather_widget`

Both tools call the same backend `getWeather(city)` function, but they do different jobs:

- `get_weather_data`
  returns structured data and plain text only
- `display_weather_widget`
  is the UI-bound tool and carries the widget metadata ChatGPT needs for iframe rendering

This is the key learning:

- one MCP server can expose multiple tools
- not every tool needs UI
- UI binding belongs to the tool descriptor, not to the whole server

### 3. Keep the widget render-only

In [frontend/mcp-apps/weather-widget.html](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-widget.html), the widget reads only the tool output that ChatGPT passes into the iframe.

It does not:

- fetch weather directly
- read the JSON file directly
- depend on the Nuxt sandbox

It only renders `structuredContent`.

### 4. Use mock data while shaping the UI

Open-Meteo and similar providers are fine later, but they introduce a separate city-to-coordinates problem.

For learning, the cleaner move was:

- keep city-name input
- store richer payloads in JSON
- get the UI and MCP contracts correct first
- only then replace mock data with a real provider

## Code Pattern

Data-only tool:

```js
server.registerTool('get_weather_data', {
  title: 'Get weather data',
  description: 'Return a small structured weather report for the requested city.',
  inputSchema: { city: z.string().min(1) }
}, async ({ city }) => {
  const report = await getWeather(city)
  return {
    structuredContent: report,
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          city: report.city,
          region: report.region,
          current: report.current,
          daily: report.daily,
          hourly: report.hourly
        }, null, 2)
      }
    ]
  }
})
```

Widget-bound tool:

```js
server.registerTool('display_weather_widget', {
  title: 'Display weather widget',
  description: 'Return a small structured weather report and render a visual widget for the requested city.',
  inputSchema: { city: z.string().min(1) },
  _meta: {
    ui: { resourceUri: TEMPLATE_URI },
    'openai/outputTemplate': TEMPLATE_URI,
    'openai/toolInvocation/invoking': 'Loading weather widget…',
    'openai/toolInvocation/invoked': 'Weather widget ready.'
  }
}, async ({ city }) => {
  const report = await getWeather(city)
  return {
    structuredContent: report,
    content: [
      {
        type: 'text',
        text: `${report.city}: ${report.current?.tempC ?? report.temperature}°C and ${report.current?.condition ?? report.condition}. ${report.current?.summary ?? report.summary}`
      }
    ]
  }
})
```

Widget render boundary:

```js
window.addEventListener('message', (event) => {
  if (event.source !== window.parent) return
  const message = event.data
  if (!message || message.jsonrpc !== '2.0') return
  if (message.method !== 'ui/notifications/tool-result') return
  render(message.params && message.params.structuredContent)
})
```

## Verification

Local MCP server:

```bash
cd frontend
npm run mcp:weather-app
```

Inspector verification:

```bash
npx @modelcontextprotocol/inspector@latest --server-url http://localhost:8787/mcp --transport http
```

Confirm:

- `display_weather_widget` exists
- `get_weather_data` exists
- both return `structuredContent`
- only `display_weather_widget` is UI-bound

ChatGPT-visible widget path:

1. expose the local server over HTTPS
2. attach the connector to ChatGPT
3. prompt explicitly for the widget tool:

```text
Use the display_weather_widget tool and render the weather widget for Madrid.
```

Observed result:

- the custom weather widget rendered inline inside ChatGPT
- the widget used the structured payload from the MCP tool
- the data-only tool remained available separately for non-visual use

## Why This Works

1. The server now separates capability from presentation.
2. The widget is no longer responsible for loading or shaping weather data.
3. The mock-data file makes iterative UI work cheap without entangling geocoding or provider APIs.
4. The two-tool split teaches the actual MCP concept:
   - data tools extend capability
   - widget tools extend the chat surface

## Prevention

- Treat the local Nuxt sandbox, the standalone Apps SDK server, and the ChatGPT connector as separate systems. A working local page does not prove the ChatGPT widget path works.
- Keep [frontend/mcp-apps/weather-app-server.mjs](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/mcp-apps/weather-app-server.mjs) as the source of truth for tool names and metadata.
- Separate data-only tools from UI-bound tools deliberately.
- After any tool-name or metadata change, assume the connector cache may be stale until refreshed.
- If the widget still looks old after a code change, verify the running local process first before debugging the HTML.
- Keep docs tightly coupled to code. If a doc mentions a tool name or endpoint, check it against the server file.

## Related Documentation

- MCP widget runbook: [docs/mcp-apps-weather.md](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/docs/mcp-apps-weather.md)
- Frontend bridge doc: [frontend/README.md](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/frontend/README.md)
- Learner handoff: [START_HERE.md](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/START_HERE.md)
- Learning plan context: [LEARNING_PLAN.md](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/LEARNING_PLAN.md)
- Related conceptual handoff: [docs/solutions/logic-errors/studio-first-learning-plan-20260411.md](/Users/vladislavcaraseli/Documents/BuildingApplicationsWithAIAgents/docs/solutions/logic-errors/studio-first-learning-plan-20260411.md)

## Follow-Up

The next improvement is polish, not architecture:

- tighten the widget CSP metadata so the `CSP off` badge disappears
- replace mock weather data with a real provider once the current UI shape is stable
