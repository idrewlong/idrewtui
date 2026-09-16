<script setup lang="ts">
import { profile } from '~/data/profile'
import { certifications } from '~/data/skills'

/**
 * The 10-second summary. Key/value pairs are a real `<dl>`; the art beside them
 * is decorative (CLAUDE.md "TUI rules").
 *
 * Rows are recruiter-relevant only — no age, height, or similar personal
 * attributes (docs/PROJECT.md §2).
 */
const certLine = certifications.map(c =>
  c.status === 'in-progress' ? `${c.name} (in progress)` : c.name,
)
</script>

<template>
  <div class="fastfetch">
    <TuiAsciiArt class="fastfetch__art" />

    <div class="fastfetch__body">
      <p class="fastfetch__handle">{{ profile.handle }}</p>
      <div class="fastfetch__underline" aria-hidden="true" />

      <dl class="kv">
        <dt>Role</dt>
        <dd>{{ profile.role }} @ {{ profile.employer }}</dd>

        <dt>Location</dt>
        <dd>{{ profile.location }}</dd>

        <dt>Stack</dt>
        <dd>{{ profile.stack.join(' · ') }}</dd>

        <dt>Infra</dt>
        <dd>{{ profile.infra.join(' · ') }}</dd>

        <dt>Certs</dt>
        <dd>
          <span v-for="(cert, i) in certLine" :key="cert">
            {{ cert }}<span v-if="i < certLine.length - 1"> · </span>
          </span>
        </dd>

        <dt>Focus</dt>
        <dd>{{ profile.focus.join(' · ') }}</dd>

        <template v-if="profile.hobbies.length">
          <dt>Hobbies</dt>
          <dd>{{ profile.hobbies.join(' · ') }}</dd>
        </template>

        <!-- Opt-in rows: not rendered at all unless the data turns them on. -->
        <template v-if="profile.status !== 'hidden'">
          <dt>Status</dt>
          <dd>{{ profile.status }}</dd>
        </template>

        <template v-if="profile.workAuthorization">
          <dt>Work auth</dt>
          <dd>{{ profile.workAuthorization }}</dd>
        </template>

        <dt>Theme</dt>
        <dd class="kv__theme" />
      </dl>
    </div>
  </div>
</template>

<style scoped>
.fastfetch {
  display: grid;
  gap: 1rem;
  /* Mobile first: art above the list (docs/PROJECT.md §4.1). */
  grid-template-columns: 1fr;
  justify-items: start;
}

.fastfetch__handle {
  color: var(--accent);
  font-weight: 600;
  font-size: var(--text-name);
  margin: 0;
}

.fastfetch__underline {
  border-bottom: 1px solid var(--line);
  margin: 0.25rem 0 0.75rem;
  width: 100%;
}

.kv {
  display: grid;
  grid-template-columns: auto;
  gap: 0.1rem 1.5rem;
}

.kv dt {
  color: var(--accent);
  font-weight: 600;
}

.kv dd {
  margin: 0 0 0.5rem;
  max-width: var(--measure);
  overflow-wrap: anywhere;
}

/* The theme name comes from the token file, so it always matches the palette. */
.kv__theme::before { content: var(--theme-name); }

@media (min-width: 40rem) {
  .fastfetch {
    grid-template-columns: auto 1fr;
    gap: 1.75rem;
    align-items: start;
  }

  /* Keys left, values aligned in a second column. */
  .kv {
    grid-template-columns: 9ch 1fr;
    align-items: baseline;
  }
  .kv dd { margin-bottom: 0.15rem; }
}
</style>
