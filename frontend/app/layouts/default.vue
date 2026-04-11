<template>
  <div class="shell">
    <div class="shell__wash" />
    <header class="shell__header">
      <div class="shell__brand-block">
        <p class="eyebrow">Building Applications With AI Agents</p>
        <NuxtLink to="/" class="brand">Agent Sandbox</NuxtLink>
        <p class="shell__tagline">An optional Vue sandbox for repo-specific interfaces. LangSmith Studio is now the primary visual workflow for agent inspection.</p>
      </div>
      <p class="shell__meta">Preserved for future custom cases. Use Studio for graph execution, tool traces, and debugging.</p>
    </header>
    <main class="shell__content">
      <slot />
    </main>
  </div>
</template>
