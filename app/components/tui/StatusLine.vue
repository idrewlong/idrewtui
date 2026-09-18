<script setup lang="ts">
import { profile } from '~/data/profile'
import type { Theme } from '~/composables/useTheme'

/**
 * tmux/vim-style status bar, inset in the frame's bottom border, and the home
 * for the click equivalents of the global shortcuts.
 */
defineProps<{
  path: string
  message?: string
  theme: Theme
  mode: string
}>()

defineEmits<{
  help: []
  'cycle-theme': []
  palette: []
  find: []
  compose: []
}>()
</script>

<template>
  <div class="frame__bar status">
    <span class="frame__label status__where">
      <span class="status__mode" aria-hidden="true">{{ mode }}</span>
      <span class="status__path">{{ path }}</span>
    </span>

    <span class="frame__gap" aria-hidden="true" />

    <span v-if="message" class="frame__label status__message">{{ message }}</span>
    <span v-else class="frame__label status__hint" aria-hidden="true">
      1-4 switch · : commands · / find · ? help
    </span>

    <span class="frame__gap" aria-hidden="true" />

    <span class="visually-hidden" role="status" aria-live="polite">{{ message }}</span>

    <span class="frame__label status__controls">
      <button
        type="button"
        class="status__btn js-only"
        @click="$emit('cycle-theme')"
      >
        <span aria-hidden="true">◑</span>
        <span class="visually-hidden">Next colour theme (current: {{ theme }})</span>
      </button>

      <button type="button" class="status__btn js-only" @click="$emit('palette')">
        <span aria-hidden="true">:</span>
        <span class="visually-hidden">Command palette</span>
      </button>

      <button type="button" class="status__btn js-only" @click="$emit('find')">
        <span aria-hidden="true">/</span>
        <span class="visually-hidden">Find in page</span>
      </button>

      <button type="button" class="status__btn js-only" @click="$emit('compose')">
        <span aria-hidden="true">m</span>
        <span class="visually-hidden">Compose email</span>
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

.status__mode,
.status__hint,
.status__location { display: none; }

@media (min-width: 48rem) {
  .status__mode,
  .status__hint,
  .status__location { display: inline; }
}
</style>
