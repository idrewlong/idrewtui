<script setup lang="ts">
/**
 * A dashboard panel: a bordered box with its title inset into the top border.
 *
 * `rows` fixes the body height in text rows. Panels must not resize when their
 * values arrive on hydration — that is the whole CLS budget.
 */
withDefaults(defineProps<{
  title: string
  /** Body height in text rows. */
  rows?: number
}>(), { rows: 4 })
</script>

<template>
  <section class="panel" :aria-label="title">
    <div class="panel__bar">
      <h2 class="panel__title">{{ title }}</h2>
      <span class="panel__gap" aria-hidden="true" />
      <span v-if="$slots.actions" class="panel__actions"><slot name="actions" /></span>
    </div>

    <div class="panel__body" :style="{ '--rows': rows }">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.panel {
  position: relative;
  /* Stacking context so the z-index:-1 border paints above the panel's own
     background but below the content. */
  isolation: isolate;
  background: var(--surface);
  min-width: 0;
}

.panel::before {
  content: "";
  position: absolute;
  inset: 0.75rem 0 0;
  border: 1px solid var(--line);
  z-index: -1;
}

.panel__bar {
  display: flex;
  align-items: center;
  height: 1.5rem;
  padding: 0 1.5ch;
  font-size: var(--text-status);
}

.panel__title,
.panel__actions {
  background: var(--surface);
  padding: 0 0.75ch;
  white-space: nowrap;
}

.panel__title {
  color: var(--accent);
  font-weight: 600;
  font-size: inherit;
}

.panel__gap { flex: 1; min-width: 1ch; }

.panel__body {
  /* Fixed height: rows x line-height, so populating values never reflows. */
  height: calc(var(--rows) * 1.6em);
  overflow: hidden;
  padding: 0.25rem 1.75ch 0.5rem;
  font-size: var(--text-status);
}
</style>
