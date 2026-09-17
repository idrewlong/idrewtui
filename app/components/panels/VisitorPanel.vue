<script setup lang="ts">
import { useVisitorSpecs } from '~/composables/useVisitorSpecs'

/**
 * The visitor's own machine. Reads are local; nothing leaves the browser.
 * Rendered as a <dl> so the key/value relationship survives without the styling.
 *
 * Several of these readings are privacy-coarsened or randomised by the
 * browser itself (`deviceMemory` clamps at 8 GB, `hardwareConcurrency` and
 * the WebGL renderer string can be farbled or masked by hardened browsers) —
 * see useVisitorSpecs.ts. The caveat line below exists so a reader doesn't
 * mistake a browser's deliberate imprecision for a wrong reading on our part.
 *
 * `rows` is 11: 8 key/value lines, the caveat (which wraps to 2 lines at
 * every measured panel width — 375/768/1024/1366/1920 — because the
 * message is wider than the panel's narrow occupied column even at its
 * widest), plus the panel body's own padding eating into the fixed height
 * (see the equivalent note this used to carry when it was 8 lines / rows=9).
 * Measured in headless Chromium: `scrollHeight === clientHeight` at 11,
 * with ~3px of slack, no clipping — see task-5-report.md for the numbers.
 */
const { specs } = useVisitorSpecs()
</script>

<template>
  <TuiPanel title="visitor" :rows="11">
    <dl class="kv">
      <template v-for="spec in specs" :key="spec.key">
        <dt>{{ spec.key }}</dt>
        <dd :class="{ 'kv__none': !spec.supported }">{{ spec.value }}</dd>
      </template>
    </dl>
    <p class="caveat">as reported by your browser · privacy settings may coarsen these</p>
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
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Unavailable, not zero. */
.kv__none { color: var(--muted); }

.caveat {
  margin: 0.35rem 0 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}
</style>
