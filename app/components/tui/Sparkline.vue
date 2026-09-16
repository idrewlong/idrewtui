<script setup lang="ts">
import { computed } from 'vue'
import { describeSeries, sparkline } from '~/utils/graph'

/**
 * Block sparkline. The glyphs are decorative; the hidden summary carries the
 * numbers, and the whole thing is deliberately not a live region — a meter
 * that announces itself every second is unusable with a screen reader.
 */
const props = withDefaults(defineProps<{
  values: readonly number[]
  unit?: string
  min?: number
  max?: number
  /** Pad to this many characters so the row cannot change width. */
  width?: number
}>(), { unit: '', width: 12, min: undefined, max: undefined })

const glyphs = computed(() => {
  const line = sparkline([...props.values], { min: props.min, max: props.max })
  return line.padStart(props.width, ' ')
})

const summary = computed(() => describeSeries([...props.values], props.unit))
</script>

<template>
  <span class="spark" aria-live="off">
    <span class="spark__glyphs" aria-hidden="true">{{ glyphs }}</span>
    <span class="visually-hidden">{{ summary }}</span>
  </span>
</template>

<style scoped>
.spark__glyphs {
  color: var(--accent);
  white-space: pre;
  letter-spacing: 0;
}
</style>
