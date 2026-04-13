import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.MCP_APPS_PORT ?? 8787)
const MCP_PATH = '/mcp'
const TEMPLATE_URI = 'ui://widget/weather-visual.html'
const WIDGET_HTML = readFileSync(resolve(__dirname, './weather-widget.html'), 'utf8')

const WEATHER_FIXTURES = {
  madrid: {
    city: 'Madrid',
    temperature: '72°F',
    condition: 'Sunny',
    summary: 'Clear skies and dry air make it a straightforward spring afternoon.',
    advice: 'Good weather for an outdoor walk. You probably do not need a jacket.'
  },
  london: {
    city: 'London',
    temperature: '48°F',
    condition: 'Cloudy',
    summary: 'A cool, overcast window with light variation in the cloud cover.',
    advice: 'Carry a layer. Conditions are stable, but it still feels cold.'
  },
  'san francisco': {
    city: 'San Francisco',
    temperature: '62°F',
    condition: 'Windy',
    summary: 'Mild temperatures with the usual wind pushing through exposed areas.',
    advice: 'Bring an extra layer even if the temperature looks comfortable.'
  },
  nyc: {
    city: 'NYC',
    temperature: '58°F',
    condition: 'Rain',
    summary: 'Cool with intermittent rain bands moving through the city.',
    advice: 'Take an umbrella. Pavement and transit platforms will be slick.'
  }
}

function normalizeCity(rawCity) {
  return rawCity.trim().toLowerCase()
}

function getWeather(city) {
  const normalized = normalizeCity(city)
  const fallbackCity = city.trim() || 'Unknown city'
  return (
    WEATHER_FIXTURES[normalized] ?? {
      city: fallbackCity,
      temperature: '65°F (approx)',
      condition: 'Sunny',
      summary: `No dedicated fixture exists for ${fallbackCity}, so this is the fallback report.`,
      advice: 'Treat this as placeholder data until you wire a real backend source.'
    }
  )
}

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
    'show_weather_widget',
    {
      title: 'Show weather widget',
      description: 'Return a small structured weather report and render a visual widget for the requested city.',
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
      const report = getWeather(city)

      return {
        structuredContent: report,
        content: [
          {
            type: 'text',
            text: `${report.city}: ${report.temperature}, ${report.condition}. ${report.summary}`
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
