<script setup lang="ts">
import { github } from '~/data/github'
import { profile } from '~/data/profile'

/**
 * Build-time public GitHub events. Unavailable data is an em-dash, never a
 * fabricated contribution graph.
 */
const sparkValues = github.supported ? github.counts : []
const profileGithub = profile.contact.find(channel => channel.channel === 'github')
</script>

<template>
  <TuiPanel title="github" :rows="6">
    <dl class="kv">
      <dt>user</dt>
      <dd>
        <a v-if="profileGithub" :href="profileGithub.href" target="_blank" rel="noopener">
          {{ github.login }}<span aria-hidden="true"> ↗</span>
          <span class="visually-hidden">(opens in a new tab)</span>
        </a>
        <span v-else>{{ github.login }}</span>
      </dd>

      <dt>30d</dt>
      <dd v-if="sparkValues.length" class="kv__spark">
        <TuiSparkline :values="sparkValues" unit=" events" :width="24" />
      </dd>
      <dd v-else class="kv__none">—</dd>

      <dt>latest</dt>
      <dd v-if="github.latest" class="kv__latest">
        <a :href="github.latest.url" target="_blank" rel="noopener">
          {{ github.latest.repo }} · {{ github.latest.message }}
          <span class="visually-hidden">(opens in a new tab)</span>
        </a>
      </dd>
      <dd v-else class="kv__none">—</dd>
    </dl>
  </TuiPanel>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 7ch 1fr;
  gap: 0.25rem 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd {
  color: var(--fg);
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kv__none { color: var(--muted); }
.kv__spark { overflow: hidden; }
.kv__latest { overflow: hidden; text-overflow: ellipsis; }
</style>
