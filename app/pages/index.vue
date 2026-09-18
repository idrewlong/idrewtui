<script setup lang="ts">
import { profile } from '~/data/profile'
import { tabs } from '~/data/navigation'
import { useClipboard } from '~/composables/useClipboard'
import { useStatusLine } from '~/composables/useStatusLine'
import { useOverlay } from '~/composables/useOverlay'
import { useYankContext } from '~/composables/useYankContext'
import { formatRecruiterCard } from '~/utils/recruiter-card'
import { track } from '~/utils/analytics'

const tab = tabs[0]!
const { copy } = useClipboard()
const { flash } = useStatusLine()
const overlay = useOverlay()
const yank = useYankContext()
const config = useRuntimeConfig()

const title = `${profile.name} — ${profile.role}`
const description = `${profile.role} at ${profile.employer} in ${profile.location}. `
  + `${profile.stack.join(', ')}. Resume, experience, projects, and skills.`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'profile',
  ogImage: '/og.png',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://idrewlong.com/' }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': profile.name,
      'jobTitle': profile.role,
      'worksFor': { '@type': 'Organization', 'name': profile.employer },
      'address': { '@type': 'PostalAddress', 'addressLocality': profile.location },
      'url': 'https://idrewlong.com/',
      'sameAs': profile.contact.filter(c => c.channel !== 'email').map(c => c.href),
    }),
  }],
})

async function copyEmail(value: string) {
  const ok = await copy(value)
  flash(ok ? `yanked ${value}` : `could not copy ${value}`)
}

async function copyCard() {
  const extra = yank.resolve()
  const text = formatRecruiterCard({
    siteUrl: String(config.public.siteUrl),
    ...extra,
  })
  const ok = await copy(text)
  flash(ok ? 'yanked recruiter card' : 'could not copy')
}
</script>

<template>
  <div>
    <TuiPrompt :title="title" :command="tab.command" :path="tab.path" />

    <TuiRule id="about" title="about" />
    <p class="measure about">{{ profile.about }}</p>

    <TuiRule id="contact" title="contact" />
    <div class="contacts">
      <div v-for="channel in profile.contact" :key="channel.channel" class="contacts__row">
        <TuiLeaderRow :label="channel.label">
          <a
            :href="channel.href"
            :target="channel.channel === 'email' ? undefined : '_blank'"
            :rel="channel.channel === 'email' ? undefined : 'noopener'"
            @click="track({ name: 'contact_click', channel: channel.channel })"
          >
            {{ channel.value }}<span v-if="channel.channel !== 'email'" aria-hidden="true"> ↗</span>
          </a>
        </TuiLeaderRow>

        <button
          v-if="channel.copyable"
          type="button"
          class="copy js-only"
          @click="copyEmail(channel.value)"
        >
          copy<span class="visually-hidden"> {{ channel.label }} address</span>
        </button>
      </div>
    </div>

    <button type="button" class="copy js-only card-copy" @click="copyCard">
      copy card<span class="visually-hidden"> as markdown</span>
    </button>
    <button type="button" class="copy js-only card-copy" @click="overlay.open('compose')">
      write<span class="visually-hidden"> an email</span>
    </button>

    <div class="actions">
      <button type="button" class="btn js-only" @click="overlay.open('pager', 'man')">
        [ man idrew ]
      </button>
      <button type="button" class="btn js-only" @click="overlay.open('pager', 'less')">
        [ Read resume ]
      </button>
      <a
        class="btn btn--primary"
        :href="profile.resumeUrl"
        target="_blank"
        rel="noopener"
        @click="track({ name: 'resume_download' })"
      >
        [ Download resume ]<span class="visually-hidden"> (PDF, opens in a new tab)</span>
      </a>
      <a class="btn" href="/resume.txt">[ resume.txt ]</a>
      <NuxtLink class="btn" to="/projects">[ See projects ]</NuxtLink>
    </div>

    <details id="man" class="fold no-js-only">
      <summary>[ man idrew ]</summary>
      <ViewsManPage />
    </details>
    <details id="resume" class="fold no-js-only">
      <summary>[ Read resume ]</summary>
      <ViewsResumeDoc />
    </details>
  </div>
</template>

<style scoped>
.about { color: var(--fg); }

.contacts { display: grid; gap: 0.35rem; }

.contacts__row {
  display: flex;
  align-items: baseline;
  gap: 1ch;
}
.contacts__row > :first-child { flex: 1; min-width: 0; }

.copy {
  flex: 0 0 auto;
  font-size: var(--text-status);
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 0 0.6ch;
}
.copy:hover { color: var(--accent); }

.card-copy { margin-top: 0.5rem; }

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.75rem;
  justify-content: flex-end;
}

.fold { margin-top: 1.5rem; }
.fold summary { cursor: pointer; color: var(--accent); }

.btn {
  border: 1px solid var(--line);
  border-radius: 2px;
  padding: 0.35rem 1ch;
  color: var(--fg);
  text-decoration: none;
  min-height: 1.5rem;
}
.btn:hover { border-color: var(--accent); color: var(--accent); }

.btn--primary {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
