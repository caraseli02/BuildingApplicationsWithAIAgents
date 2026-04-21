export interface McpDocLink {
  label: string
  url: string
}

export interface WeatherSandboxRequest {
  city: string
}

export interface WeatherSandboxResponse {
  status: 'todo' | 'ok'
  requestId: string
  city: string
  answer: string | null
  message: string
  implementationFile: string
  docs: McpDocLink[]
  nextSteps: string[]
}
