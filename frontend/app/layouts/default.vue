<template>
  <div class="shell">
    <div class="shell__wash" />
    <header class="shell__header">
      <div class="shell__brand-block">
        <p class="eyebrow">Building Applications With AI Agents</p>
        <NuxtLink to="/" class="brand">Agent Run Explorer</NuxtLink>
        <p class="shell__tagline">A field desk for replaying agent decisions, customer-facing outcomes, and the operational truth in between.</p>
      </div>
      <p class="shell__meta">Personal V1 for running and inspecting one scenario deeply.</p>
    </header>
    <main class="shell__content">
      <slot />
    </main>
  </div>
</template>
