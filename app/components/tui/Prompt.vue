<script setup lang="ts">
import { onMounted, ref } from 'vue'

/**
 * The page's `h1`, shown as a shell prompt.
 *
 * The accessible name is the real page title; the prompt decoration is
 * aria-hidden, so a screen reader hears "Andrew Long — ..." rather than
 * "guest at idrewlong dot com colon tilde dollar".
 *
 * Motion: the command types once per page load (~300ms), never on tab switches
 * and never under reduced motion (docs/PROJECT.md §5).
 *
 * The command text is always in the DOM at full width. "Typing" is a mask slid
 * across it with `transform`, and the cursor rides the mask's leading edge.
 * Transforms don't affect layout, so the effect contributes zero CLS — a naive
 * character-by-character version moves the cursor and scores ~0.002.
 */
const props = defineProps<{
  /** Real heading text, for assistive tech and SEO. */
  title: string
  /** The command shown after the prompt, e.g. `fastfetch`. */
  command: string
  /** Host part of the prompt. */
  user?: string
  path?: string
}>()

const user = props.user ?? 'guest@idrewlong.com'
const path = props.path ?? '~'

/** 0 = nothing typed, 1 = fully typed. Starts revealed for SSR and no-JS. */
const progress = ref(1)
const animating = ref(false)

onMounted(() => {
  if (hasTypedOnce) return
  hasTypedOnce = true

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const steps = Math.max(props.command.length, 1)
  progress.value = 0
  animating.value = true

  let i = 0
  const id = setInterval(() => {
    i += 1
    progress.value = i / steps
    if (i >= steps) {
      clearInterval(id)
      animating.value = false
    }
  }, Math.max(12, Math.round(300 / steps)))
})
</script>

<script lang="ts">
/** True after the first prompt on a page load has animated. */
let hasTypedOnce = false
</script>

<template>
  <h1 class="prompt">
    <span class="visually-hidden">{{ title }}</span>
    <span aria-hidden="true" class="prompt__line">
      <span class="prompt__user">{{ user }}</span><span class="prompt__path">:{{ path }}</span><span class="prompt__sigil">$</span>
      <span class="prompt__command" :style="{ '--p': progress }">
        <span class="prompt__text">{{ command }}</span>
        <span class="prompt__mask">
          <TuiCursor class="prompt__cursor" :blink="!animating" />
        </span>
      </span>
    </span>
  </h1>
</template>

<style scoped>
.prompt {
  font-size: var(--text-prompt);
  font-weight: 400;
  margin-bottom: 1.25rem;
  overflow-wrap: anywhere;
}
.prompt__user { color: var(--link); }
.prompt__path { color: var(--muted); }
.prompt__sigil {
  color: var(--accent);
  font-weight: 600;
  margin-right: 0.5ch;
}

.prompt__command {
  position: relative;
  display: inline-block;
  /* Room for the cursor to sit past the last character. */
  padding-right: 1ch;
  color: var(--fg);
}

/* Slides right to uncover the text. Transform only — never affects layout. */
.prompt__mask {
  position: absolute;
  inset: 0;
  background: var(--surface);
  transform: translateX(calc(var(--p, 1) * 100%));
  will-change: transform;
}

/* The block cursor rides the mask's leading edge. */
.prompt__cursor {
  position: absolute;
  left: 0;
}
</style>
