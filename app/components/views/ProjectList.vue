<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { projects } from '~/data/projects'
import type { Project, ProjectCategory } from '~/types/content'
import { formatDate } from '~/utils/format'
import { track } from '~/utils/analytics'
import { useYankContext } from '~/composables/useYankContext'
import { useFind } from '~/composables/useFind'
import { useSelection } from '~/composables/useSelection'

/**
 * ranger/yazi two-pane listing. `<details>` stay for no-JS; with JS the
 * right pane is a live preview of the selected row. j/k move, Enter opens
 * the project's link when one exists.
 */
type Filter = 'all' | ProjectCategory

const filters: Filter[] = ['all', 'client', 'oss', 'writing']
const active = ref<Filter>('all')
const yank = useYankContext()
const find = useFind()
const route = useRoute()

watch(active, () => find.rescan())

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

const visible = computed(() => groups.value.flatMap(group => group.items))
const selection = useSelection(() => visible.value.length)
const selected = computed(() => visible.value[selection.index.value] ?? null)

watch(selected, (project) => {
  if (project) yank.setProject(project.slug)
}, { immediate: true })

function selectSlug(slug: string) {
  const index = visible.value.findIndex(project => project.slug === slug)
  if (index >= 0) selection.index.value = index
}

watch(() => route.hash, (hash) => {
  const id = hash.replace(/^#/, '')
  if (id) selectSlug(id)
}, { immediate: true })

function cycleFilter() {
  const i = filters.indexOf(active.value)
  active.value = filters[(i + 1) % filters.length]!
}

function onToggle(slug: string, event: Event) {
  const details = event.target as HTMLDetailsElement
  if (details.open) {
    yank.setProject(slug)
    track({ name: 'project_open', slug })
  }
}

function openSelected() {
  const project = selected.value
  if (!project?.href) return
  track({ name: 'project_open', slug: project.slug })
  window.open(project.href, '_blank', 'noopener')
}

function isSelected(project: Project) {
  return selected.value?.slug === project.slug
}

defineExpose({
  cycleFilter,
  down: () => selection.down(),
  up: () => selection.up(),
  openSelected,
})
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

    <div class="ranger js-only">
      <div class="ranger__list">
        <div v-for="group in groups" :key="group.category" class="group">
          <h2 class="group__head">
            <span class="group__mode glyph" aria-hidden="true">{{ group.mode }}</span>
            <span class="group__label">{{ group.label }}</span>
          </h2>

          <ul class="rows" role="listbox" :aria-label="group.label">
            <li v-for="project in group.items" :key="project.slug" role="option" :aria-selected="isSelected(project)">
              <button
                type="button"
                class="row"
                :data-selected="isSelected(project)"
                @click="selectSlug(project.slug)"
              >
                <span class="row__name">{{ project.name }}</span>
                <span v-if="project.summary" class="row__desc">{{ project.summary }}</span>
                <span v-else class="row__todo">description pending</span>
                <time v-if="project.published" class="row__date" :datetime="project.published">
                  {{ formatDate(project.published) }}
                </time>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <section v-if="selected" class="ranger__preview" :aria-label="`Preview ${selected.name}`">
        <h3 class="preview__name">{{ selected.name }}</h3>
        <p v-if="selected.summary" class="preview__summary">{{ selected.summary }}</p>
        <p v-else class="row__todo">description pending</p>
        <ViewsProjectDetail :project="selected" />
      </section>
    </div>

    <div class="no-js-only">
      <div v-for="group in groups" :key="group.category" class="group">
        <h2 class="group__head">
          <span class="group__mode glyph" aria-hidden="true">{{ group.mode }}</span>
          <span class="group__label">{{ group.label }}</span>
        </h2>

        <ul class="rows">
          <li v-for="project in group.items" :key="project.slug">
            <details
              :id="project.slug"
              class="fold"
              @toggle="onToggle(project.slug, $event)"
            >
              <summary class="row">
                <span class="row__name">{{ project.name }}</span>
                <span v-if="project.summary" class="row__desc">{{ project.summary }}</span>
                <span v-else class="row__todo">description pending</span>
                <time v-if="project.published" class="row__date" :datetime="project.published">
                  {{ formatDate(project.published) }}
                </time>
              </summary>
              <ViewsProjectDetail :project="project" />
            </details>
          </li>
        </ul>
      </div>
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

.ranger {
  display: grid;
  gap: 1rem;
}

@media (min-width: 40rem) {
  .ranger {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
}

.ranger__preview {
  border: 1px solid var(--line);
  padding: 0.75rem 1ch;
  min-width: 0;
}

.preview__name {
  color: var(--accent);
  margin: 0 0 0.35rem;
}

.preview__summary {
  color: var(--muted);
  margin: 0 0 0.75rem;
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

.row {
  cursor: pointer;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 1.5ch;
  padding: 0.2rem 0.5ch;
  width: 100%;
  text-align: left;
  color: inherit;
  font: inherit;
  background: transparent;
  border: 0;
}
.row::-webkit-details-marker { display: none; }
.row:hover,
.row[data-selected="true"] {
  background: color-mix(in srgb, var(--line) 35%, transparent);
}
.row:hover .row__name,
.row[data-selected="true"] .row__name { color: var(--accent); }

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

.fold { padding-bottom: 0.5rem; }
.fold .row { display: flex; }
</style>
