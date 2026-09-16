<script setup lang="ts">
import { computed } from 'vue'
import { barMeter } from '~/utils/graph'

const props = withDefaults(defineProps<{
  fraction: number
  width?: number
  label: string
}>(), { width: 10 })

const glyphs = computed(() => barMeter(props.fraction, props.width))
const percent = computed(() => `${Math.round(Math.min(1, Math.max(0, props.fraction)) * 100)}%`)
</script>

<template>
  <span class="bar" aria-live="off">
    <span class="bar__glyphs" aria-hidden="true">{{ glyphs }}</span>
    <span class="visually-hidden">{{ label }} {{ percent }}</span>
  </span>
</template>

<style scoped>
.bar__glyphs { color: var(--accent); white-space: pre; }
</style>
