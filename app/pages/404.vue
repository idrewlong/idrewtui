<script setup lang="ts">
import { profile } from '~/data/profile'

/**
 * Prerendered so the static `404.html` a host serves for unknown paths has real
 * content and a title, and works with no JavaScript. `scripts/finalize-static.mjs`
 * copies the built page over Nuxt's SPA-fallback `404.html`.
 */
useSeoMeta({
  title: `Not found — ${profile.name}`,
  description: 'That path does not exist on idrewlong.com.',
  robots: 'noindex, follow',
})
</script>

<template>
  <ViewsNotFound />
</template>
