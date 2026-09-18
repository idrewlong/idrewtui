<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOverlay } from '~/composables/useOverlay'
import { useTheme } from '~/composables/useTheme'
import { useSelection } from '~/composables/useSelection'
import { filterCatalog, paletteCatalog, type PaletteItem } from '~/utils/palette'
import { track } from '~/utils/analytics'

const overlay = useOverlay()
const router = useRouter()
const { set: setTheme } = useTheme()

const open = computed(() => overlay.mode.value === 'palette')
const query = ref('')
const catalog = paletteCatalog()

const groups = computed(() => filterCatalog(catalog, query.value))
const flat = computed(() => groups.value.flatMap(g => g.items))
const selection = useSelection(() => flat.value.length)

watch(open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    selection.first()
  }
})

watch(query, () => {
  selection.first()
})

const emit = defineEmits<{
  resume: []
  yankEmail: []
  yankCard: []
}>()

function run(item: PaletteItem | undefined) {
  if (!item) return

  switch (item.action.kind) {
    case 'route': {
      const tab = item.action.to === '/' ? 'info'
        : item.action.to.replace(/^\//, '')
      if (item.id.startsWith('tab:')) {
        track({ name: 'tab_switch', tab })
      }
      if (item.action.hash) {
        void router.push({ path: item.action.to, hash: `#${item.action.hash}` })
      }
      else {
        void router.push(item.action.to)
      }
      break
    }
    case 'resume':
      emit('resume')
      break
    case 'yank-email':
      emit('yankEmail')
      break
    case 'yank-card':
      emit('yankCard')
      break
    case 'man':
      overlay.open('pager', 'man')
      return
    case 'less':
      overlay.open('pager', 'less')
      return
    case 'help':
      overlay.open('help')
      return
    case 'compose':
      overlay.open('compose')
      return
    case 'theme':
      setTheme(item.action.theme)
      break
  }

  overlay.close()
}

function onQueryKeydown(event: KeyboardEvent) {
  if (event.key === 'j' || event.key === 'ArrowDown') {
    event.preventDefault()
    selection.down()
    return
  }
  if (event.key === 'k' || event.key === 'ArrowUp') {
    event.preventDefault()
    selection.up()
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    run(flat.value[selection.index.value])
  }
}

function groupLabel(group: 'jump' | 'actions' | 'themes') {
  return group
}
</script>

<template>
  <TuiOverlay
    :open="open"
    title=":"
    title-id="palette-title"
    close-label="command palette"
    size="wide"
    @close="overlay.close()"
  >
    <label class="visually-hidden" for="palette-input">Filter commands</label>
    <input
      id="palette-input"
      v-model="query"
      data-overlay-focus
      class="query"
      type="search"
      autocomplete="off"
      spellcheck="false"
      placeholder="fuzzy find"
      @keydown="onQueryKeydown"
    >

    <p v-if="flat.length === 0" class="empty">no matches</p>

    <div v-for="g in groups" :key="g.group" class="group">
      <h3 class="group__title">{{ groupLabel(g.group) }}</h3>
      <ul class="rows">
        <li v-for="item in g.items" :key="item.id">
          <button
            type="button"
            class="row"
            :data-selected="selection.isSelected(flat.indexOf(item))"
            @click="run(item)"
            @mouseenter="selection.index.value = flat.indexOf(item)"
          >
            {{ item.label }}
          </button>
        </li>
      </ul>
    </div>
  </TuiOverlay>
</template>

<style scoped>
.query {
  width: 100%;
  font: inherit;
  color: var(--fg);
  background: var(--bg);
  border: 1px solid var(--line);
  padding: 0.35rem 1ch;
  margin: 0.5rem 0 0.75rem;
}

.empty {
  color: var(--muted);
  margin: 0.5rem 0 0;
}

.group { margin-top: 0.75rem; }

.group__title {
  color: var(--muted);
  font-weight: 400;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.25rem;
  margin-bottom: 0.35rem;
}

.rows { display: grid; gap: 0; }

.row {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.2rem 0.5ch;
  min-height: 1.5rem;
  color: var(--fg);
}
.row:hover,
.row[data-selected="true"] {
  background: var(--surface-hi);
  color: var(--accent);
}
</style>
