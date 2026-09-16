<script setup lang="ts">
import { certifications, education, skillGroups } from '~/data/skills'

/**
 * `tree ~/skills`. Plain text so it stays searchable and ATS/LLM friendly —
 * no bars, levels, or percentages (docs/PROJECT.md §4.4).
 *
 * The tree branch glyphs are decorative; the lists read correctly without them.
 */

/** `[x]` earned, `[~]` in progress — decorative marker beside real status text. */
function marker(status: string) {
  return status === 'earned' ? '[x]' : '[~]'
}
</script>

<template>
  <div class="tree">
    <section>
      <h2 class="tree__root">skills</h2>
      <dl class="branches">
        <template v-for="(group, i) in skillGroups" :key="group.label">
          <dt class="branch">
            <span class="glyph" aria-hidden="true">{{ i === skillGroups.length - 1 ? '└──' : '├──' }}</span>
            <span class="branch__label">{{ group.label }}</span>
          </dt>
          <dd class="branch__items">{{ group.items.join('  ') }}</dd>
        </template>
      </dl>
    </section>

    <section>
      <h2 class="tree__root">certs</h2>
      <ul class="branches branches--list">
        <li v-for="(cert, i) in certifications" :key="cert.name" class="cert">
          <span class="glyph" aria-hidden="true">{{ i === certifications.length - 1 ? '└──' : '├──' }}</span>
          <span class="cert__marker glyph" aria-hidden="true">{{ marker(cert.status) }}</span>
          <span class="cert__name">
            <a v-if="cert.href" :href="cert.href" target="_blank" rel="noopener">{{ cert.name }}</a>
            <template v-else>{{ cert.name }}</template>
          </span>
          <span class="cert__status" :data-status="cert.status">
            {{ cert.status === 'earned' ? 'active' : 'in progress' }}
          </span>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="tree__root">education</h2>
      <ul class="branches branches--list">
        <li v-for="(entry, i) in education" :key="entry.institution" class="edu">
          <span class="glyph" aria-hidden="true">{{ i === education.length - 1 ? '└──' : '├──' }}</span>
          <span class="edu__body">
            <span class="edu__institution">{{ entry.institution }}</span>
            <span class="edu__credential"> — {{ entry.credential }}</span>
            <span v-if="entry.honors.length" class="edu__honors">{{ entry.honors.join(' · ') }}</span>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.tree { display: grid; gap: 1.75rem; }

.tree__root {
  color: var(--link);
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.branches { display: grid; gap: 0.15rem; }

.branches--list { display: grid; gap: 0.35rem; }

.branch {
  display: flex;
  gap: 1ch;
  align-items: baseline;
}

.branch__label {
  color: var(--accent);
  font-weight: 600;
}

.branch__items {
  color: var(--fg);
  /* Indent past the branch glyph so values line up under each other. */
  padding-left: 4ch;
  margin-bottom: 0.5rem;
  max-width: var(--measure);
  overflow-wrap: anywhere;
}

.cert,
.edu {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1ch;
  align-items: baseline;
}

.cert__name { color: var(--fg); }

.cert__status {
  color: var(--muted);
  font-size: var(--text-status);
}
.cert__status[data-status="earned"] { color: var(--link); }

.edu__body {
  display: flex;
  flex-wrap: wrap;
  gap: 0 1ch;
  align-items: baseline;
  max-width: var(--measure);
}

.edu__institution { color: var(--fg); font-weight: 600; }
.edu__credential { color: var(--fg); }

.edu__honors {
  color: var(--muted);
  font-size: var(--text-status);
  flex-basis: 100%;
}

@media (min-width: 40rem) {
  /* dt/dd alternate, so a two-column grid puts each label beside its values. */
  .branches:not(.branches--list) {
    grid-template-columns: 16ch 1fr;
    align-items: baseline;
    gap: 0.15rem 1rem;
  }

  .branch__items {
    padding-left: 0;
    margin-bottom: 0.15rem;
  }
}
</style>
