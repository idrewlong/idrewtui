<script setup lang="ts">
import { computed, ref } from 'vue'
import { projects } from '~/data/projects'
import type { ProjectCategory } from '~/types/content'
import { formatDate } from '~/utils/format'
import { track } from '~/utils/analytics'

/**
 * `ls -la ~/projects`, grouped by category with a filter row.
 *
 * Rows expand into a detail panel via `<details>`, so it works without JS.
 * `f` cycles the filter; the same filters are buttons (docs/PROJECT.md §4.3).
 */
type Filter = 'all' | ProjectCategory

const filters: Filter[] = ['all', 'client', 'oss', 'writing']
const active = ref<Filter>('all')

const groupLabels: Record<ProjectCategory, string> = {
  client: 'client/',
  oss: 'oss/',
  writing: 'writing/',
}

/** Directory-style permission column. Decorative. */
const groupModes: Record<ProjectCategory, string> = {
  client: 'drwxr-xr-x',
  oss: 'drwxr-xr-x',
  writing: '-rw-r--r--',
}

const groups = computed(() => {
  const order: ProjectCategory[] = ['client', 'oss', 'writing']
  return order
    .filter(c => active.value === 'all' || active.value === c)
    .map(category => ({
      category,
      label: groupLabels[category],
      mode: groupModes[category],
      items: projects.filter(p => p.category === category),
    }))
    .filter(g => g.items.length > 0)
})

function cycleFilter() {
  const i = filters.indexOf(active.value)
  active.value = filters[(i + 1) % filters.length]!
}

defineExpose({ cycleFilter })
</script>

<template>
  <div>
    <div class="filters js-only" role="group" aria-label="Filter projects">
      <button
        v-for="f in filters"
        :key="f"
        type="button"
        class="filter"
        :aria-pressed="active === f"
        @click="active = f"
      >
        [{{ f }}]
      </button>
    </div>

    <div v-for="group in groups" :key="group.category" class="group">
      <h2 class="group__head">
        <span class="group__mode glyph" aria-hidden="true">{{ group.mode }}</span>
        <span class="group__label">{{ group.label }}</span>
      </h2>

      <ul class="rows">
        <li v-for="project in group.items" :key="project.slug">
          <details class="row" @toggle="track({ name: 'project_open', slug: project.slug })">
            <summary class="row__summary">
              <span class="row__name">{{ project.name }}</span>

              <span v-if="project.summary" class="row__desc">{{ project.summary }}</span>
              <!-- Placeholder rather than an invented description. -->
              <span v-else class="row__todo">description pending</span>

              <time v-if="project.published" class="row__date" :datetime="project.published">
                {{ formatDate(project.published) }}
              </time>
            </summary>

            <div class="row__detail">
              <dl v-if="project.detail" class="detail">
                <template v-if="project.detail.role">
                  <dt>Role</dt><dd>{{ project.detail.role }}</dd>
                </template>
                <template v-if="project.detail.stack?.length">
                  <dt>Stack</dt><dd>{{ project.detail.stack.join(' · ') }}</dd>
                </template>
                <template v-if="project.detail.challenge">
                  <dt>Hard part</dt><dd>{{ project.detail.challenge }}</dd>
                </template>
                <template v-if="project.detail.outcome">
                  <dt>Outcome</dt><dd>{{ project.detail.outcome }}</dd>
                </template>
              </dl>

              <p v-if="project.tags.length" class="tags">
                <span v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</span>
              </p>

              <a v-if="project.href" class="row__link" :href="project.href" target="_blank" rel="noopener">
                {{ project.href.replace(/^https?:\/\//, '') }}<span aria-hidden="true"> ↗</span>
                <span class="visually-hidden">(opens in a new tab)</span>
              </a>
              <p v-else class="row__todo">link pending</p>
            </div>
          </details>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  font-size: var(--text-status);
}

.filter { color: var(--muted); }
.filter:hover { color: var(--fg); }
.filter[aria-pressed="true"] {
  color: var(--accent);
  font-weight: 600;
  text-decoration: underline;
}

.group { margin-bottom: 1.5rem; }

.group__head {
  display: flex;
  gap: 1.5ch;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.group__mode { font-size: var(--text-status); }
.group__label { color: var(--link); font-weight: 600; }

.rows { display: grid; gap: 0.15rem; }

.row__summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 1.5ch;
  padding: 0.2rem 0.5ch;
}
.row__summary::-webkit-details-marker { display: none; }
.row__summary:hover { background: color-mix(in srgb, var(--line) 35%, transparent); }
.row__summary:hover .row__name { color: var(--accent); }

.row__name {
  color: var(--fg);
  font-weight: 600;
  flex: 0 0 auto;
}

.row__desc,
.row__date {
  color: var(--muted);
  font-size: var(--text-status);
}

.row__todo {
  color: var(--danger);
  font-size: var(--text-status);
  margin: 0;
}

.row__detail {
  padding: 0.5rem 0 0.75rem 2ch;
  border-left: 1px solid var(--line);
  margin-left: 0.5ch;
  max-width: var(--measure);
}

.detail {
  display: grid;
  grid-template-columns: 10ch 1fr;
  gap: 0.15rem 1rem;
  margin-bottom: 0.5rem;
}
.detail dt { color: var(--muted); }

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5ch;
  margin: 0 0 0.5rem;
}

.tag {
  font-size: var(--text-status);
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 0 0.6ch;
}
</style>
