import type { WeatherSandboxRequest } from '~/shared/mcp-sandbox'
import { callWeatherMcp } from '../../utils/mcp/weather-client'

export default defineEventHandler(async (event) => {
  const body = await readBody<WeatherSandboxRequest>(event)
  const city = body?.city?.trim()

  if (!city) {
    throw createError({
      statusCode: 400,
      statusMessage: 'City is required'
    })
  }

  return await callWeatherMcp(city)
})
