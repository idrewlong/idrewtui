<script setup lang="ts">
import { useVisitorSpecs } from '~/composables/useVisitorSpecs'

/**
 * The visitor's own machine. Reads are local; nothing leaves the browser.
 * Rendered as a <dl> so the key/value relationship survives without the styling.
 *
 * `rows` is 9, not 8, even though there are exactly 8 key/value lines: the
 * body's own padding (`.panel__body`, 12px at the default font size) eats
 * into the fixed height set by `rows`, so 8 would clip about half a row off
 * the bottom (measured at 1366x768 in headless Chromium). 9 rows leaves the
 * 8 lines fully visible with only ~9px of unused space below them.
 */
const { specs } = useVisitorSpecs()
</script>

<template>
  <TuiPanel title="visitor" :rows="9">
    <dl class="kv">
      <template v-for="spec in specs" :key="spec.key">
        <dt>{{ spec.key }}</dt>
        <dd :class="{ 'kv__none': !spec.supported }">{{ spec.value }}</dd>
      </template>
    </dl>
  </TuiPanel>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 8ch 1fr;
  gap: 0 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd {
  color: var(--fg);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Unavailable, not zero. */
.kv__none { color: var(--muted); }
</style>
