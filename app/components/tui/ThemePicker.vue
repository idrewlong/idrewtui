<script setup lang="ts">
import { ref } from 'vue'
import { radioGroupTarget } from '~/utils/radiogroup'
import { THEME_NAMES, type Theme } from '~/composables/useTheme'

/**
 * Theme list, styled as a panel body. `t` cycles; clicking picks directly.
 * A radiogroup rather than a listbox: these are mutually exclusive settings
 * applied immediately, not a value being selected for later submission.
 *
 * Roving tabindex per the WAI-ARIA radio pattern: only the selected radio is
 * a tab stop; Up/Down/Left/Right and Home/End move both focus and the
 * selection, same as a native radio group. Enter/Space/Tab are left alone —
 * the browser already fires `click` for them on a focused button.
 */
const props = defineProps<{ current: Theme }>()
const emit = defineEmits<{ select: [Theme] }>()

const buttons = ref<HTMLButtonElement[]>([])

function onKeydown(event: KeyboardEvent) {
  const current = THEME_NAMES.indexOf(props.current)
  const target = radioGroupTarget(event.key, current, THEME_NAMES.length)
  if (target === null) return

  event.preventDefault()
  const name = THEME_NAMES[target]!
  emit('select', name)
  buttons.value[target]?.focus()
}
</script>

<template>
  <ul class="themes" role="radiogroup" aria-label="Colour theme" @keydown="onKeydown">
    <li v-for="name in THEME_NAMES" :key="name">
      <button
        ref="buttons"
        type="button"
        class="theme"
        role="radio"
        :aria-checked="name === current"
        :tabindex="name === current ? 0 : -1"
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
