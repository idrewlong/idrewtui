<script setup lang="ts">
/**
 * Blinking block cursor. Decorative only.
 *
 * `blink` is off while the prompt is typing — the cursor is moving then, and a
 * blink on top of that reads as a glitch. Static under reduced motion.
 */
withDefaults(defineProps<{ blink?: boolean }>(), { blink: true })
</script>

<template>
  <span class="cursor" :class="{ 'cursor--blink': blink }" aria-hidden="true">█</span>
</template>

<style scoped>
.cursor {
  color: var(--accent);
  user-select: none;
}

.cursor--blink {
  animation: blink 1.1s steps(1, end) infinite;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .cursor--blink { animation: none; }
}
</style>
