<script setup lang="ts">
import { formatManPage } from '~/utils/resume'
import { track } from '~/utils/analytics'

const man = formatManPage()
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
</script>

<template>
  <article class="man">
    <h3 class="man__name">{{ man.name }}</h3>
    <dl class="kv">
      <dt>Role</dt><dd>{{ man.role }}</dd>
      <dt>Org</dt><dd>{{ man.employer }}</dd>
      <dt>Loc</dt><dd>{{ man.location }}</dd>
      <dt>Stack</dt><dd>{{ man.stack.join(' · ') }}</dd>
      <dt>Certs</dt>
      <dd>
        <span v-for="(cert, i) in man.certs" :key="cert">
          {{ cert }}<template v-if="i < man.certs.length - 1"> · </template>
        </span>
      </dd>
    </dl>

    <h4 class="man__h">contact</h4>
    <ul class="man__contact">
      <li v-for="channel in man.contact" :key="channel.channel">
        <a
          :href="channel.href"
          :target="channel.channel === 'email' ? undefined : '_blank'"
          :rel="channel.channel === 'email' ? undefined : 'noopener'"
          @click="track({ name: 'contact_click', channel: channel.channel })"
        >
          {{ channel.label }}: {{ channel.value }}
        </a>
      </li>
    </ul>

    <p class="man__resume">
      <a
        :href="man.resumeUrl"
        target="_blank"
        rel="noopener"
        @click="track({ name: 'resume_download' })"
      >
        Download resume
        <span class="visually-hidden"> (PDF, opens in a new tab)</span>
      </a>
    </p>
    <p class="man__curl">
      <a :href="`${siteUrl}/resume.txt`">curl {{ siteUrl }}/resume.txt</a>
    </p>
  </article>
</template>

<style scoped>
.man { max-width: var(--measure); }

.man__name {
  color: var(--accent);
  font-size: var(--text-name);
  margin-bottom: 0.75rem;
}

.kv {
  display: grid;
  grid-template-columns: 7ch 1fr;
  gap: 0.2rem 1.5ch;
}
.kv dt { color: var(--muted); }
.kv dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }

.man__h {
  margin: 1rem 0 0.35rem;
  color: var(--muted);
  font-weight: 400;
}

.man__contact { display: grid; gap: 0.25rem; }

.man__resume { margin-top: 1rem; }
.man__curl {
  margin-top: 0.35rem;
  color: var(--muted);
  font-size: var(--text-status);
}
</style>
