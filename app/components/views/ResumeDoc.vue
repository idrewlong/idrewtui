<script setup lang="ts">
import { formatResume } from '~/utils/resume'
import { track } from '~/utils/analytics'

const resume = formatResume()
</script>

<template>
  <article class="doc">
    <header>
      <h3 class="doc__name">{{ resume.name }}</h3>
      <p class="doc__headline">{{ resume.headline }}</p>
      <p class="doc__loc">{{ resume.location }}</p>
    </header>

    <p class="doc__about">{{ resume.about }}</p>

    <h4>contact</h4>
    <ul>
      <li v-for="channel in resume.contact" :key="channel.channel">
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

    <h4>experience</h4>
    <section v-for="role in resume.experience" :key="role.title + role.employer" class="role">
      <h5>{{ role.title }} · {{ role.employer }}</h5>
      <p class="muted">{{ role.dates }}</p>
      <ul v-if="role.bullets.length">
        <li v-for="bullet in role.bullets" :key="bullet">{{ bullet }}</li>
      </ul>
    </section>

    <h4>skills</h4>
    <dl class="kv">
      <template v-for="group in resume.skills" :key="group.label">
        <dt>{{ group.label }}</dt>
        <dd>{{ group.items.join(' · ') }}</dd>
      </template>
    </dl>

    <h4>certifications</h4>
    <ul>
      <li v-for="cert in resume.certs" :key="cert">{{ cert }}</li>
    </ul>

    <h4>education</h4>
    <section v-for="ed in resume.education" :key="ed.institution">
      <h5>{{ ed.institution }} — {{ ed.credential }}</h5>
      <p v-if="ed.honors.length" class="muted">{{ ed.honors.join(' · ') }}</p>
    </section>

    <h4>projects</h4>
    <section v-for="project in resume.projects" :key="project.name" class="role">
      <h5>{{ project.name }}</h5>
      <p v-if="project.summary">{{ project.summary }}</p>
      <p v-if="project.href">
        <a :href="project.href" target="_blank" rel="noopener">{{ project.href }}</a>
      </p>
    </section>

    <p class="doc__pdf">
      <a
        :href="resume.resumeUrl"
        target="_blank"
        rel="noopener"
        @click="track({ name: 'resume_download' })"
      >
        Download resume PDF
        <span class="visually-hidden"> (opens in a new tab)</span>
      </a>
    </p>
  </article>
</template>

<style scoped>
.doc { max-width: var(--measure); }

.doc__name {
  color: var(--accent);
  font-size: var(--text-name);
}

.doc__headline { margin: 0.15rem 0 0; }
.doc__loc { color: var(--muted); margin: 0 0 0.75rem; }
.doc__about { margin-bottom: 1rem; }

h4 {
  margin: 1.25rem 0 0.4rem;
  color: var(--muted);
  font-weight: 400;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.15rem;
}

h5 { margin: 0; }

.role { margin-bottom: 0.85rem; }
.muted { color: var(--muted); margin: 0 0 0.25rem; }

.role ul,
.doc > ul {
  display: grid;
  gap: 0.25rem;
}

.role li,
.doc > ul li {
  padding-left: 2ch;
  text-indent: -2ch;
  color: var(--fg);
}
.role li::before,
.doc > ul li::before {
  content: "─ ";
  color: var(--muted);
}

.kv {
  display: grid;
  grid-template-columns: 12ch 1fr;
  gap: 0.2rem 1ch;
}
.kv dt { color: var(--muted); }
.kv dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }

.doc__pdf { margin-top: 1.5rem; }
</style>
