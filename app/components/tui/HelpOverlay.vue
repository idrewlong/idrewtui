<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { shortcutGroupLabels, shortcuts, type ShortcutGroup } from '~/composables/useKeybindings'

/**
 * Modal shortcut list. Fed by the single shortcut table in useKeybindings.ts.
 * Focus is trapped while open and restored to the trigger on close
 * (docs/PROJECT.md §4.5).
 */
const open = defineModel<boolean>({ required: true })

const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let lastFocused: HTMLElement | null = null

const groups = computed(() => {
  const order: ShortcutGroup[] = ['navigation', 'movement', 'actions']
  return order.map(group => ({
    group,
    label: shortcutGroupLabels[group],
    items: shortcuts.filter(s => s.group === group),
  }))
})

watch(open, async (isOpen) => {
  if (isOpen) {
    lastFocused = document.activeElement as HTMLElement | null
    await nextTick()
    closeButton.value?.focus()
  }
  else {
    lastFocused?.focus()
    lastFocused = null
  }
})

/** Keep Tab inside the dialog while it's open. */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    open.value = false
    return
  }

  if (event.key !== 'Tab' || !dialog.value) return

  const focusable = dialog.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (focusable.length === 0) return

  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  const active = document.activeElement

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="backdrop"
      @click.self="open = false"
      @keydown="onKeydown"
    >
      <div
        ref="dialog"
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <div class="dialog__head">
          <h2 id="help-title" class="dialog__title">keyboard shortcuts</h2>
          <button ref="closeButton" type="button" class="dialog__close" @click="open = false">
            <span aria-hidden="true">esc</span>
            <span class="visually-hidden">Close keyboard shortcuts</span>
          </button>
        </div>

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
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  z-index: 50;
}

.dialog {
  width: min(44ch, 100%);
  max-height: 85vh;
  overflow-y: auto;
  border: 1px solid var(--line);
  background: var(--surface);
  padding: 1.25rem;
}

.dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.dialog__title { color: var(--accent); }

.dialog__close {
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 0 0.5ch;
}
.dialog__close:hover { color: var(--fg); }

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
