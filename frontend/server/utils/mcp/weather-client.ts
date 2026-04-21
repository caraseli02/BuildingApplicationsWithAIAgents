import type { WeatherSandboxResponse } from '#shared/mcp-sandbox'
import { MCP_WEATHER_TOOL, MCP_WEATHER_URL } from './config'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const WEATHER_MCP_DOCS = [
  {
    label: 'LangChain MCP docs',
    url: 'https://docs.langchain.com/oss/python/langchain/mcp'
  },
  {
    label: 'Model Context Protocol TypeScript SDK',
    url: 'https://github.com/modelcontextprotocol/typescript-sdk'
  },
  {
    label: 'Model Context Protocol specification',
    url: 'https://modelcontextprotocol.io'
  }
] as const

function logWeatherMcp(requestId: string, message: string, extra?: unknown): void {
  if (extra === undefined) {
    console.info(`[mcp-weather-client][${requestId}] ${message}`)
    return
  }
  console.info(`[mcp-weather-client][${requestId}] ${message}`, extra)
}

export async function callWeatherMcp(city: string, requestId: string): Promise<WeatherSandboxResponse> {
  const client = new Client({
    name: 'weather-client',
    version: '1.0.0'
  })

  const transport = new StreamableHTTPClientTransport(new URL(MCP_WEATHER_URL))

  try {
    logWeatherMcp(requestId, `Connecting to MCP weather server at ${MCP_WEATHER_URL}`)
    await client.connect(transport)

    const { tools } = await client.listTools()
    logWeatherMcp(requestId, 'Discovered MCP tools', tools)

    const weatherTool = tools.find((tool) => tool.name === MCP_WEATHER_TOOL)

    if (!weatherTool) {
      throw new Error(`Tool '${MCP_WEATHER_TOOL}' was not found.`)
    }

    logWeatherMcp(requestId, `Calling MCP tool "${MCP_WEATHER_TOOL}" for city="${city}"`)
    const result = await client.callTool({
      name: MCP_WEATHER_TOOL,
      arguments: {
        query: `What is the weather in ${city}?`,
        request_id: requestId
      }
    })

    logWeatherMcp(requestId, 'Received MCP tool result', result)

    const answer =
      result &&
      typeof result === 'object' &&
      'structuredContent' in result &&
      result.structuredContent &&
      typeof result.structuredContent === 'object' &&
      'result' in result.structuredContent &&
      typeof result.structuredContent.result === 'string'
        ? result.structuredContent.result
        : null

    logWeatherMcp(
      requestId,
      answer
        ? `Extracted weather answer successfully for city="${city}"`
        : `No answer text could be extracted for city="${city}"`
    )

    return {
      status: answer ? 'ok' : 'todo',
      requestId,
      city,
      answer,
      message: answer
        ? 'Nuxt server route successfully called the MCP weather server.'
        : 'The MCP call completed, but no text answer was extracted from the result.',
      implementationFile: 'frontend/server/utils/mcp/weather-client.ts',
      docs: [...WEATHER_MCP_DOCS],
      nextSteps: answer
        ? [
          'Try another city served by the MCP weather server.',
          'Handle MCP errors cleanly in the server utility.',
          'Optionally add loading and error-state polish in the page.'
        ]
        : [
          'Inspect the MCP result shape again.',
          'Adjust the answer extraction logic.',
          'Return `status: ok` once `answer` is populated.'
        ]
    }
  } catch (error) {
    console.error(`[mcp-weather-client][${requestId}] MCP weather call failed`, error)
    throw error
  } finally {
    await client.close()
    logWeatherMcp(requestId, 'Closed MCP client connection')
  }
}
