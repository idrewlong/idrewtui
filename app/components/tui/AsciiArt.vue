<script setup lang="ts">
/**
 * The decorative mark beside the fastfetch block: "iD" in block letters, for
 * iDrew. This settles the open art question in docs/PROJECT.md §10.
 *
 * Purely decorative, so the block is aria-hidden; the fastfetch list carries
 * all the real information. It scales with a media query rather than swapping
 * variants, so the prerendered markup is correct at every width and nothing
 * shifts on hydration.
 */
const mark = [
  ' ██    ██████▄',
  '       ██   ██',
  ' ██    ██   ██',
  ' ██    ██   ██',
  ' ██    ██████▀',
].join('\n')
</script>

<template>
  <pre class="art" aria-hidden="true">{{ mark }}</pre>
</template>

<style scoped>
.art {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1;
  color: var(--accent);
  user-select: none;
  overflow: hidden;
}

@media (min-width: 40rem) {
  .art { font-size: 1rem; }
}
</style>
