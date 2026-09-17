<script setup lang="ts">
import { computed } from 'vue'
import { brailleChart, describeSeries } from '~/utils/graph'

/**
 * Multi-row braille curve, the linecast-style rendering. Glyphs are decorative;
 * the hidden summary carries the numbers.
 */
const props = withDefaults(defineProps<{
  values: readonly number[]
  unit?: string
  width?: number
  height?: number
  label: string
}>(), { unit: '', width: 24, height: 3 })

const rows = computed(() =>
  brailleChart([...props.values], { width: props.width, height: props.height }))

const summary = computed(() => `${props.label}: ${describeSeries([...props.values], props.unit)}`)

const bounds = computed(() => {
  const usable = [...props.values].filter(Number.isFinite)
  return usable.length ? { hi: Math.max(...usable), lo: Math.min(...usable) } : null
})
</script>

<template>
  <div class="chart" aria-live="off">
    <div class="chart__plot" aria-hidden="true">
      <div v-if="bounds" class="chart__axis">
        <span>{{ bounds.hi }}</span>
        <span>{{ bounds.lo }}</span>
      </div>
      <pre class="chart__rows">{{ rows.join('\n') }}</pre>
    </div>
    <span class="visually-hidden">{{ summary }}</span>
  </div>
</template>

<style scoped>
.chart__plot { display: flex; gap: 1ch; align-items: stretch; }

.chart__axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--muted);
  font-size: var(--text-status);
}

.chart__rows {
  margin: 0;
  color: var(--accent);
  line-height: 1;
  font-family: var(--font-mono);
}
</style>
