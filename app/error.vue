<script setup lang="ts">
import type { NuxtError } from '#app'
import { profile } from '~/data/profile'

/**
 * Runtime and client-side navigation errors. Unknown paths on a static host are
 * served the prerendered `404.html` instead (see `app/pages/404.vue`); this
 * covers everything else and shares the same body component.
 */
const props = defineProps<{ error?: NuxtError }>()

const isNotFound = props.error?.statusCode === 404

useSeoMeta({
  title: isNotFound ? `Not found — ${profile.name}` : `Error — ${profile.name}`,
  robots: 'noindex, follow',
})
</script>

<template>
  <NuxtLayout>
    <!-- The path is filled in from the URL on mount; NuxtError carries no url. -->
    <ViewsNotFound :message="isNotFound ? 'No such file or directory' : 'Internal error'" />
  </NuxtLayout>
</template>
