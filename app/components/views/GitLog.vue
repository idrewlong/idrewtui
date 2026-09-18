<script setup lang="ts">
import { experience } from '~/data/experience'
import { formatRange, machineRange } from '~/utils/format'
import { useYankContext } from '~/composables/useYankContext'
import { roleStat } from '~/utils/role-stat'

/**
 * Work history as a `git log --graph`.
 *
 * Each role is a `<details>`, so expanding works with no JS at all; the two most
 * recent are open by default (docs/PROJECT.md §4.2). The graph glyphs and the
 * fake commit hashes are decorative and aria-hidden.
 */

const yank = useYankContext()
const entries = experience.map(role => ({ role, stat: roleStat(role) }))

/** Stable decorative "hash" per role — derived, so it never changes between builds. */
function fakeHash(slug: string): string {
  let h = 0
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h.toString(16).padStart(7, '0').slice(0, 7)
}

function onToggle(slug: string, event: Event) {
  const details = event.target as HTMLDetailsElement
  if (details.open) yank.setRole(slug)
}
</script>

<template>
  <ol class="log">
    <li v-for="entry in entries" :key="entry.role.slug" class="log__item">
      <span class="log__graph glyph" aria-hidden="true">*</span>

      <details
        :id="entry.role.slug"
        class="role"
        :open="entry.role.featured"
        @toggle="onToggle(entry.role.slug, $event)"
      >
        <summary class="role__summary">
          <span class="role__hash glyph" aria-hidden="true">{{ fakeHash(entry.role.slug) }}</span>
          <time class="role__dates" :datetime="machineRange(entry.role.start, entry.role.end)">
            {{ formatRange(entry.role.start, entry.role.end) }}
          </time>
          <span class="role__title">
            <h2 class="role__heading">{{ entry.role.title }}</h2>
            <span class="role__employer">· {{ entry.role.employer }}</span>
          </span>
          <p v-if="entry.stat.stack.length" class="role__stat">
            <span aria-hidden="true">--stat  </span>{{ entry.stat.stack.join(' · ') }}
          </p>
        </summary>

        <ul v-if="entry.role.bullets.length" class="role__bullets">
          <li v-for="bullet in entry.role.bullets" :key="bullet">{{ bullet }}</li>
        </ul>
      </details>
    </li>
  </ol>
</template>

<style scoped>
.log { display: block; }

.log__item {
  display: grid;
  grid-template-columns: 2ch 1fr;
  align-items: start;
}

/* The vertical graph line, drawn as a border rather than repeated glyphs. */
.log__graph {
  color: var(--accent);
  justify-self: start;
  line-height: 1.6;
}

.log__item:not(:last-child) .log__graph {
  border-left: 1px solid var(--line);
  /* Sits under the marker and runs to the next entry. */
  margin-left: 0.25ch;
  padding-left: 0.5ch;
  margin-right: 0;
  height: 100%;
  box-sizing: border-box;
}

.role { padding-bottom: 1rem; }

.role__summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0 1ch;
  align-items: baseline;
}
.role__summary::-webkit-details-marker { display: none; }
.role__summary:hover .role__heading { color: var(--accent); }

.role__hash {
  font-size: var(--text-status);
  flex: 0 0 auto;
}

.role__dates {
  color: var(--muted);
  flex: 0 0 auto;
  white-space: nowrap;
}

.role__title {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1ch;
  align-items: baseline;
}

.role__heading {
  display: inline;
  color: var(--fg);
  font-weight: 600;
}

.role__employer { color: var(--link); }

.role__stat {
  flex: 1 1 100%;
  margin: 0.15rem 0 0;
  color: var(--muted);
  font-size: var(--text-status);
}

.role__bullets {
  margin-top: 0.5rem;
  max-width: var(--measure);
  display: grid;
  gap: 0.35rem;
}

.role__bullets li {
  color: var(--muted);
  padding-left: 2ch;
  text-indent: -2ch;
}
.role__bullets li::before {
  content: "─ ";
  color: var(--muted);
}
</style>
