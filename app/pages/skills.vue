<script setup lang="ts">
import { profile } from '~/data/profile'
import { tabs } from '~/data/navigation'
import { skillGroups } from '~/data/skills'

const tab = tabs[3]!

const title = `Skills — ${profile.name}`
const description = `Stack, certifications, and education for ${profile.name}: `
  + `${skillGroups.flatMap(g => g.items).slice(0, 10).join(', ')}.`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: '/og.png',
  twitterCard: 'summary_large_image',
})

useHead({ link: [{ rel: 'canonical', href: 'https://idrewlong.com/skills' }] })
</script>

<template>
  <div>
    <TuiPrompt :title="title" :command="tab.command" :path="tab.path" />
    <ViewsSkillTree />
  </div>
</template>
