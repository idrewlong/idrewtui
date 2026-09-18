<script setup lang="ts">
import { computed } from 'vue'
import { shortcutGroupLabels, shortcuts, type ShortcutGroup } from '~/composables/useKeybindings'
import { useOverlay } from '~/composables/useOverlay'

/**
 * Modal shortcut list. Fed by the single shortcut table in useKeybindings.ts.
 */
const overlay = useOverlay()
const open = computed(() => overlay.mode.value === 'help')

const groups = computed(() => {
  const order: ShortcutGroup[] = ['navigation', 'movement', 'actions']
  return order.map(group => ({
    group,
    label: shortcutGroupLabels[group],
    items: shortcuts.filter(s => s.group === group),
  }))
})
</script>

<template>
  <TuiOverlay
    :open="open"
    title="keyboard shortcuts"
    title-id="help-title"
    @close="overlay.close()"
  >
    <div v-for="g in groups" :key="g.group" class="group">
      <h3 class="group__title">{{ g.label }}</h3>
      <dl class="group__list">
        <template v-for="s in g.items" :key="s.action">
          <dt><kbd>{{ s.label }}</kbd></dt>
          <dd>{{ s.description }}</dd>
        </template>
      </dl>
    </div>

    <p class="dialog__note">
      Every shortcut here has a button or link on the page too.
    </p>
  </TuiOverlay>
</template>

<style scoped>
.group { margin-top: 1rem; }

.group__title {
  color: var(--muted);
  font-weight: 400;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.25rem;
  margin-bottom: 0.5rem;
}

.group__list {
  display: grid;
  grid-template-columns: 6ch 1fr;
  gap: 0.35rem 1rem;
}

kbd {
  font: inherit;
  color: var(--accent);
  font-weight: 600;
}

dd { color: var(--fg); }

.dialog__note {
  margin-top: 1.25rem;
  color: var(--muted);
  font-size: var(--text-status);
}
</style>
