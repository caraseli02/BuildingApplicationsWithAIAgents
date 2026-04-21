<script setup lang="ts">
import type { WeatherSandboxResponse } from '#shared/mcp-sandbox'

useHead({
  title: 'MCP Weather Sandbox'
})

const city = ref('Mallorca')
const pending = ref(false)
const response = ref<WeatherSandboxResponse | null>(null)
const errorMessage = ref('')

const submitWeatherLookup = async () => {
  pending.value = true
  errorMessage.value = ''

  try {
    response.value = await $fetch<WeatherSandboxResponse>('/api/mcp/weather', {
      method: 'POST',
      body: { city: city.value }
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unknown sandbox failure'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="panel sandbox-notice">
    <p class="eyebrow">Battle test</p>
    <p class="sandbox-notice__text">
      This page is intentionally scaffolded but not finished. The Nuxt route and server utility exist,
      but you still need to implement the MCP client call yourself inside the server utility.
    </p>
  </div>

  <div class="page-grid">
    <section class="panel panel-stack">
      <div class="section-head">
        <p class="eyebrow">Nuxt + MCP</p>
        <h1 class="section-title">Weather Sandbox</h1>
        <p class="section-copy">
          Use this page to battle-test the weather MCP server from the Nuxt app. The browser submits to a
          Nuxt server route, and your server route should become the MCP client boundary.
        </p>
      </div>

      <div class="form-grid">
        <div class="field">
          <label for="city">City</label>
          <input id="city" v-model="city" type="text" placeholder="Mallorca" />
          <p class="field-hint">
            Keep the browser thin. The MCP connection belongs in the server utility, not in this page.
          </p>
        </div>
      </div>

      <div class="cta-row">
        <button class="button" :disabled="pending" @click="submitWeatherLookup">
          {{ pending ? 'Calling route…' : 'Call Weather Sandbox' }}
        </button>

        <div class="launch-footer-copy">
          <p class="launch-footer-copy__label">Target route</p>
          <p class="muted">POST /api/mcp/weather</p>
        </div>
      </div>
    </section>

    <section class="panel panel-stack">
      <div class="section-head section-head--compact">
        <p class="eyebrow">Implementation guide</p>
        <h2 class="panel-title">Next steps</h2>
      </div>

      <p v-if="errorMessage" class="mcp-inline-error">
        {{ errorMessage }}
      </p>

      <template v-if="response">
        <div class="status-pill" :class="response.status === 'ok' ? 'is-completed' : 'is-warning'">
          {{ response.status === 'ok' ? 'implemented' : 'todo' }}
        </div>

        <p class="section-copy">
          {{ response.message }}
        </p>

        <div class="panel request-meta">
          <p class="eyebrow">Request correlation</p>
          <p class="request-meta__label">Request ID</p>
          <p class="mcp-mono">{{ response.requestId }}</p>
          <p class="field-hint">
            Use this ID to match the browser action to the Nuxt route log, MCP client log, and MCP weather server log.
          </p>
        </div>

        <div v-if="response.answer" class="summary-quote">
          <p class="eyebrow">Server response</p>
          <p class="summary-quote__text">{{ response.answer }}</p>
        </div>

        <div class="panel-stack">
          <div>
            <p class="eyebrow">File to edit</p>
            <p class="mcp-mono">{{ response.implementationFile }}</p>
          </div>

          <div>
            <p class="eyebrow">Docs to follow</p>
            <div class="preset-grid">
              <a
                v-for="doc in response.docs"
                :key="doc.url"
                class="preset-card"
                :href="doc.url"
                target="_blank"
                rel="noreferrer"
              >
                <p class="preset-card__eyebrow">Reference</p>
                <h3 class="preset-card__title">{{ doc.label }}</h3>
                <p class="section-copy">Open the official docs and use them to implement the server-side MCP client.</p>
              </a>
            </div>
          </div>

          <div>
            <p class="eyebrow">Suggested implementation order</p>
            <ol class="mcp-steps">
              <li v-for="step in response.nextSteps" :key="step">{{ step }}</li>
            </ol>
          </div>
        </div>
      </template>

      <p v-else class="section-copy">
        Submit a city once to get the scaffolded instructions and docs links from the Nuxt route.
      </p>
    </section>
  </div>
</template>
