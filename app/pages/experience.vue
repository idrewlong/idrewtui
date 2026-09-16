<script setup lang="ts">
import { profile } from '~/data/profile'
import { tabs } from '~/data/navigation'
import { experience } from '~/data/experience'

const tab = tabs[1]!

const title = `Experience — ${profile.name}`
const description = `Work history for ${profile.name}: `
  + `${experience.slice(0, 3).map(e => `${e.title} at ${e.employer}`).join(', ')}.`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: '/og.png',
  twitterCard: 'summary_large_image',
})

useHead({ link: [{ rel: 'canonical', href: 'https://idrewlong.com/experience' }] })
</script>

<template>
  <div>
    <TuiPrompt :title="title" :command="tab.command" :path="tab.path" />
    <ViewsGitLog />
  </div>
</template>
