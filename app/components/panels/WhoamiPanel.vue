<script setup lang="ts">
import { profile } from '~/data/profile'
import { certifications } from '~/data/skills'
import { track } from '~/utils/analytics'

/**
 * The recruiter panel. Prerendered from `app/data`, so it is correct with
 * JavaScript disabled and it is the first thing in the DOM.
 */
const certLine = certifications
  .map(c => (c.status === 'in-progress' ? `${c.name} (in progress)` : c.name))
  .join(' · ')
</script>

<template>
  <TuiPanel title="whoami" :rows="6">
    <dl class="kv">
      <dt>Role</dt><dd>{{ profile.role }}</dd>
      <dt>Org</dt><dd>{{ profile.employer }}</dd>
      <dt>Loc</dt><dd>{{ profile.location }}</dd>
      <dt>Stack</dt><dd>{{ profile.stack.join(' · ') }}</dd>
      <dt>Certs</dt><dd>{{ certLine }}</dd>
    </dl>

    <a
      class="resume"
      :href="profile.resumeUrl"
      target="_blank"
      rel="noopener"
      @click="track({ name: 'resume_download' })"
    >
      [ resume ↓ ]<span class="visually-hidden"> (PDF, opens in a new tab)</span>
    </a>
  </TuiPanel>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 6ch 1fr;
  gap: 0 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd {
  color: var(--fg);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  margin-top: 0.25rem;
  color: var(--accent);
  text-decoration: none;
}
.resume:hover { text-decoration: underline; }
</style>
