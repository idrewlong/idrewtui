<script setup lang="ts">
import { THEME_NAMES, type Theme } from '~/composables/useTheme'

/**
 * Theme list, styled as a panel body. `t` cycles; clicking picks directly.
 * A radiogroup rather than a listbox: these are mutually exclusive settings
 * applied immediately, not a value being selected for later submission.
 */
defineProps<{ current: Theme }>()
defineEmits<{ select: [Theme] }>()
</script>

<template>
  <ul class="themes" role="radiogroup" aria-label="Colour theme">
    <li v-for="name in THEME_NAMES" :key="name">
      <button
        type="button"
        class="theme"
        role="radio"
        :aria-checked="name === current"
        @click="$emit('select', name)"
      >
        <span class="theme__marker" aria-hidden="true">{{ name === current ? '▸' : ' ' }}</span>
        <span class="theme__name">{{ name }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.themes { display: grid; gap: 0.1rem; }

.theme {
  display: flex;
  align-items: center;
  gap: 1ch;
  width: 100%;
  min-height: 1.5rem;
  color: var(--muted);
  text-align: left;
}
.theme:hover { color: var(--fg); }

.theme[aria-checked="true"] {
  color: var(--accent);
  font-weight: 600;
}

.theme__marker { color: var(--accent); }
</style>
