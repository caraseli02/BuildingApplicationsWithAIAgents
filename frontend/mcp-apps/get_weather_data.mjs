import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WEATHER_MOCK_DATA_PATH = resolve(__dirname, './weather-mock-data.json')

function normalizeCity(rawCity) {
  return rawCity.trim().toLowerCase()
}

async function loadWeatherMockData() {
  const rawJson = await readFile(WEATHER_MOCK_DATA_PATH, 'utf8')
  return JSON.parse(rawJson)
}

export async function getWeather(city) {
  /*
    This is the current server-side normalization boundary.

    Right now:
    - it loads mock city data from weather-mock-data.json

    Later:
    - it should fetch real provider data
    - but still return the exact same normalized payload shape

    Good future implementation sequence:
    1. geocode city -> coordinates
    2. fetch forecast from provider
    3. map provider response into:
       {
         city,
         region,
         temperature,
         condition,
         summary,
         advice,
         current,
         daily,
         hourly
       }
  */
  const normalized = normalizeCity(city)
  const mockData = await loadWeatherMockData()
  const fallbackCity = city.trim() || 'Unknown city'

  return (
    mockData[normalized] ?? {
      city: fallbackCity,
      region: 'Mock region',
      temperature: '65°F (approx)',
      condition: 'Sunny',
      summary: `No dedicated mock entry exists for ${fallbackCity}, so this is the fallback report.`,
      advice: 'Add a city entry to weather-mock-data.json before switching to a real weather provider.',
      current: {
        tempC: 18,
        tempF: 65,
        condition: 'Sunny',
        summary: `Fallback conditions for ${fallbackCity}.`
      },
      daily: [
        { day: 'Tue', icon: 'sunny', highC: 18, lowC: 11 },
        { day: 'Wed', icon: 'partly-cloudy', highC: 20, lowC: 12 }
      ],
      hourly: [
        { label: '1pm', tempC: 17 },
        { label: '4pm', tempC: 18 },
        { label: '7pm', tempC: 16 }
      ]
    }
  )
}
