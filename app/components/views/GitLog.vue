<script setup lang="ts">
import { experience } from '~/data/experience'
import { formatRange, machineRange } from '~/utils/format'

/**
 * Work history as a `git log --graph`.
 *
 * Each role is a `<details>`, so expanding works with no JS at all; the two most
 * recent are open by default (docs/PROJECT.md §4.2). The graph glyphs and the
 * fake commit hashes are decorative and aria-hidden.
 */

/** Stable decorative "hash" per role — derived, so it never changes between builds. */
function fakeHash(slug: string): string {
  let h = 0
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h.toString(16).padStart(7, '0').slice(0, 7)
}
</script>

<template>
  <ol class="log">
    <li v-for="role in experience" :key="role.slug" class="log__item">
      <span class="log__graph glyph" aria-hidden="true">*</span>

      <details class="role" :open="role.featured">
        <summary class="role__summary">
          <span class="role__hash glyph" aria-hidden="true">{{ fakeHash(role.slug) }}</span>
          <time class="role__dates" :datetime="machineRange(role.start, role.end)">
            {{ formatRange(role.start, role.end) }}
          </time>
          <span class="role__title">
            <h2 class="role__heading">{{ role.title }}</h2>
            <span class="role__employer">· {{ role.employer }}</span>
          </span>
        </summary>

        <ul v-if="role.bullets.length" class="role__bullets">
          <li v-for="bullet in role.bullets" :key="bullet">{{ bullet }}</li>
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
