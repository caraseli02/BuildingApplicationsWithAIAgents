import type { WeatherSandboxResponse } from '#shared/mcp-sandbox'
import { MCP_WEATHER_TOOL, MCP_WEATHER_URL } from './config'

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

export async function callWeatherMcp(city: string): Promise<WeatherSandboxResponse> {
  /*
   * TODO: implement the Nuxt-side MCP client here.
   *
   * Recommended direction:
   * 1. Use the official TypeScript MCP SDK from `@modelcontextprotocol/sdk`.
   * 2. Open a client transport against `MCP_WEATHER_URL`.
   * 3. Ask the server for tools, confirm `MCP_WEATHER_TOOL` exists, then call it.
   * 4. Pass the same query shape used by the Python client:
   *      { query: `What is the weather in ${city}?` }
   * 5. Extract the returned text into the `answer` field below.
   * 6. Keep the MCP protocol and network details inside this server utility.
   *
   * Why this file exists:
   * - browser code should not talk to MCP directly
   * - Nuxt server routes are the right boundary for secrets, transport, and retries
   * - once this function is implemented, the page and route should not need more changes
   */
  void MCP_WEATHER_URL
  void MCP_WEATHER_TOOL

  return {
    status: 'todo',
    city,
    answer: null,
    message: 'Implement `callWeatherMcp()` in frontend/server/utils/mcp/weather-client.ts to connect the Nuxt server route to the MCP weather server.',
    implementationFile: 'frontend/server/utils/mcp/weather-client.ts',
    docs: [...WEATHER_MCP_DOCS],
    nextSteps: [
      'Install frontend dependencies so the TypeScript MCP SDK is available.',
      `Connect to ${MCP_WEATHER_URL} from this server utility, not from browser code.`,
      `Discover tools and confirm the server exposes \`${MCP_WEATHER_TOOL}\`.`,
      'Call the weather tool with a query string for the requested city.',
      'Return the tool text as `answer` and switch `status` from `todo` to `ok`.'
    ]
  }
}
