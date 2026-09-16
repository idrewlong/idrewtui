<script setup lang="ts">
/**
 * A dotted-leader row: label ············ value
 * The dots are a border on a flex spacer, not typed characters.
 */
defineProps<{ label: string }>()
</script>

<template>
  <div class="leader">
    <span class="leader__label">{{ label }}</span>
    <span class="leader__fill" aria-hidden="true" />
    <span class="leader__value"><slot /></span>
  </div>
</template>

<style scoped>
.leader__label {
  color: var(--muted);
  flex: 0 0 auto;
}
.leader__value {
  flex: 0 1 auto;
  text-align: right;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
