import type { WeatherSandboxRequest } from '#shared/mcp-sandbox'
import { callWeatherMcp } from '../../utils/mcp/weather-client'

export default defineEventHandler(async (event) => {
  const body = await readBody<WeatherSandboxRequest>(event)
  const city = body?.city?.trim()
  const requestId = crypto.randomUUID()
  if (!city) {
    throw createError({
      statusCode: 400,
      statusMessage: 'City is required'
    })
  }

  console.info(`[mcp-weather-route][${requestId}] Received weather request for city="${city}"`)

  try {
    const response = await callWeatherMcp(city, requestId)
    console.info(`[mcp-weather-route][${requestId}] Completed weather request with status="${response.status}"`)
    return response
  } catch (error) {
    console.error(`[mcp-weather-route][${requestId}] Weather request failed`, error)
    throw error
  }
})
