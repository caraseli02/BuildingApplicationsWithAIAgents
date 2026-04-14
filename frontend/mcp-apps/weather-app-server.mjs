import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'
import { getWeather } from './get_weather_data.mjs'

/*
  TODO roadmap for replacing the mock-data payload with a real ChatGPT-like weather card.

  Work in this order:
  1. Keep using weather-mock-data.json while you redesign the widget shape.
  2. Once the widget layout is stable, replace getWeather(city) with:
     - city -> coordinates lookup
     - forecast API fetch
     - normalization into the same payload shape
  3. Keep content[] as a short text fallback for non-UI clients.
  4. Do not leak provider-specific response shapes into weather-widget.html.

  Official references:
  - Apps SDK MCP server guide:
    https://developers.openai.com/apps-sdk/build/mcp-server
  - Apps SDK UI guide:
    https://developers.openai.com/apps-sdk/build/chatgpt-ui
  - Apps SDK examples:
    https://github.com/openai/openai-apps-sdk-examples

  Note on Open-Meteo:
  - it works well, but it wants coordinates
  - the clean production path is "geocode city first, then fetch forecast"
  - for now, keep city-name development simple by loading weather-mock-data.json

  TODO exercises for learning MCP better:

  SMALL
  - File to edit: frontend/mcp-apps/weather-mock-data.json
  - Add one more city entry, for example "mallorca".
  - Do not change this server file.
  - Restart the server and verify the widget renders the new city.
  - Lesson: the MCP tool contract stays stable while the widget is purely data-driven.
  - Status: complete

  MEDIUM
  - File to edit: this file
  - Rename the widget tool to something less generic.
  - Current result:
    - tool name: display_weather_widget
    - title: Display weather widget
  - Restart the server and refresh the connector in ChatGPT.
  - Lesson: tool identity and metadata affect routing and how ChatGPT selects tools.
  - Status: complete

  HARD
  - File to edit: this file
  - Split the server into two tools:
    1. get_weather_data
    2. display_weather_widget
  - Both tools can call getWeather(city), but only the widget tool should include:
    - _meta.ui.resourceUri
    - _meta["openai/outputTemplate"]
  - Lesson: the same MCP server can expose machine-friendly tools and UI-bound tools
    separately.
  - Status: complete
*/

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.MCP_APPS_PORT ?? 8787)
const MCP_PATH = '/mcp'
const TEMPLATE_URI = 'ui://widget/weather-visual.html'
const WIDGET_HTML = readFileSync(resolve(__dirname, './weather-widget.html'), 'utf8')


function createWeatherServer() {
  const server = new McpServer(
    { name: 'weather-visual-server', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {} } }
  )

  registerAppResource(server, 'weather-widget', TEMPLATE_URI, {}, async () => ({
    contents: [
      {
        uri: TEMPLATE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: WIDGET_HTML,
        _meta: {
          ui: {
            prefersBorder: true,
            description: 'A compact weather card rendered inside ChatGPT.',
            csp: {
              connectDomains: [],
              resourceDomains: []
            }
          }
        }
      }
    ]
  }))

  server.registerTool(
    'display_weather_widget',
    {
      title: 'Display weather widget',
      description: 'Return a small structured weather report and render a visual widget for the requested city.',
      /*
        This is the UI-bound MCP tool.

        Learning point:
        - this tool has widget metadata
        - ChatGPT can render the HTML resource after it runs
        - use this when you want visible UI in the chat
      */
      inputSchema: {
        city: z.string().min(1)
      },
      _meta: {
        ui: { resourceUri: TEMPLATE_URI },
        'openai/outputTemplate': TEMPLATE_URI,
        'openai/toolInvocation/invoking': 'Loading weather widget…',
        'openai/toolInvocation/invoked': 'Weather widget ready.'
      }
    },
    async ({ city }) => {
      const report = await getWeather(city)

      /*
        Keep this split:
        - structuredContent: full data for the widget
        - content[]: short text fallback for clients that do not render the widget

        When you upgrade the payload, prefer reading from report.current here,
        but keep the top-level fields while the current widget still uses them.
      */
      return {
        structuredContent: report,
        content: [
          {
            type: 'text',
            text: `${report.city}: ${report.current?.tempC ?? report.temperature}°C and ${report.current?.condition ?? report.condition}. ${report.current?.summary ?? report.summary}`
          }
        ]
      }
    }
  )

  server.registerTool(
    'get_weather_data',
    {
      title: 'Get weather data',
      description: 'Return a small structured weather report for the requested city.',
      inputSchema: {
        city: z.string().min(1)
      },
    },
    async ({ city }) => {
      const report = await getWeather(city)

      /*
        This is the data-only MCP tool.

        Learning point:
        - same backend capability as the widget tool
        - no UI metadata
        - useful for plain tool output, agents, or downstream composition
      */
      return {
        structuredContent: report,
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                city: report.city,
                region: report.region,
                current: report.current,
                daily: report.daily,
                hourly: report.hourly
              },
              null,
              2
            )
          }
        ]
      }
    }
  )

  return server
}

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end('Missing URL')
    return
  }

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)

  if (req.method === 'OPTIONS' && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, mcp-session-id',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id'
    })
    res.end()
    return
  }

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('Weather visual MCP server')
    return
  }

  const mcpMethods = new Set(['POST', 'GET', 'DELETE'])

  if (url.pathname === MCP_PATH && req.method && mcpMethods.has(req.method)) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id')

    const server = createWeatherServer()
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    })

    res.on('close', () => {
      transport.close()
      server.close()
    })

    try {
      await server.connect(transport)
      await transport.handleRequest(req, res)
    } catch (error) {
      console.error('Error handling MCP request:', error)
      if (!res.headersSent) {
        res.writeHead(500).end('Internal server error')
      }
    }
    return
  }

  res.writeHead(404).end('Not Found')
})

httpServer.listen(PORT, () => {
  console.log(`Weather visual MCP server listening on http://localhost:${PORT}${MCP_PATH}`)
})
