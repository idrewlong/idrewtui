<script setup lang="ts">
import { profile } from '~/data/profile'
import type { Theme } from '~/composables/useTheme'

/**
 * tmux/vim-style status bar, inset in the frame's bottom border, and the home
 * for the click equivalents of the global shortcuts (`t` theme, `?` help) —
 * every shortcut needs a visible control (CLAUDE.md "Keyboard").
 *
 * Segments are separate labels so the border line shows between them. On narrow
 * screens it collapses to path + controls (docs/PROJECT.md §3).
 *
 * `message` is a transient echo like "yanked idrewlong@gmail.com". It replaces
 * the hint text and is announced politely so it isn't missed by screen readers.
 */
defineProps<{
  /** Current location, e.g. `~/experience`. */
  path: string
  /** Transient confirmation, or '' for none. */
  message?: string
  theme: Theme
}>()

defineEmits<{ help: [], 'toggle-theme': [] }>()
</script>

<template>
  <div class="frame__bar status">
    <span class="frame__label status__where">
      <span class="status__mode" aria-hidden="true">NORMAL</span>
      <span class="status__path">{{ path }}</span>
    </span>

    <span class="frame__gap" aria-hidden="true" />

    <span v-if="message" class="frame__label status__message">{{ message }}</span>
    <span v-else class="frame__label status__hint" aria-hidden="true">
      1-4 switch · j/k scroll · ? help
    </span>

    <span class="frame__gap" aria-hidden="true" />

    <!-- Live region kept in the DOM at all times so updates are announced. -->
    <span class="visually-hidden" role="status" aria-live="polite">{{ message }}</span>

    <span class="frame__label status__controls">
      <button
        type="button"
        class="status__btn js-only"
        :aria-pressed="theme === 'light'"
        @click="$emit('toggle-theme')"
      >
        <span aria-hidden="true">{{ theme === 'light' ? '◐' : '◑' }}</span>
        <span class="visually-hidden">Use {{ theme === 'light' ? 'dark' : 'light' }} theme</span>
      </button>

      <button type="button" class="status__btn js-only" @click="$emit('help')">
        <span aria-hidden="true">?</span>
        <span class="visually-hidden">Keyboard shortcuts</span>
      </button>

      <span class="status__location">{{ profile.location }}</span>
    </span>
  </div>
</template>

<style scoped>
.status { color: var(--muted); }

.status__where,
.status__controls {
  display: inline-flex;
  align-items: center;
  gap: 1ch;
}

.status__mode {
  color: var(--bg);
  background: var(--accent);
  font-weight: 600;
  padding: 0 0.6ch;
}

.status__path { color: var(--fg); }

.status__message {
  color: var(--accent);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* WCAG 2.2 target size: at least 24x24px, which fits inside the 2rem bar. */
.status__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  min-height: 1.5rem;
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 0 0.5ch;
}
.status__btn:hover { color: var(--fg); }

/* Narrow: keep the path and the controls, drop the decoration. */
.status__mode,
.status__hint,
.status__location { display: none; }

@media (min-width: 48rem) {
  .status__mode,
  .status__hint,
  .status__location { display: inline; }
}
</style>
