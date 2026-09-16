<script setup lang="ts">
import { ref } from 'vue'
import { profile } from '~/data/profile'
import { tabs } from '~/data/navigation'
import { usePageShortcuts } from '~/composables/usePageShortcuts'

const tab = tabs[2]!

const title = `Projects — ${profile.name}`
const description = 'Client sites, open source tools, and writing by '
  + `${profile.name}, ${profile.role} at ${profile.employer}.`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: '/og.png',
  twitterCard: 'summary_large_image',
})

useHead({ link: [{ rel: 'canonical', href: 'https://idrewlong.com/projects' }] })

const list = ref<{ cycleFilter: () => void } | null>(null)

// `f` cycles the filter; the filter buttons do the same thing with a click.
usePageShortcuts({
  'projects:filter': () => list.value?.cycleFilter(),
})
</script>

<template>
  <div>
    <TuiPrompt :title="title" :command="tab.command" :path="tab.path" />
    <ViewsProjectList ref="list" />
  </div>
</template>
