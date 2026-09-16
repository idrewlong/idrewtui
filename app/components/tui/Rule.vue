<script setup lang="ts">
/**
 * Inline-titled divider: ──── about ────
 * Rendered as a heading with border pseudo-elements, so the "line" is CSS and
 * can't break when the title wraps.
 */
withDefaults(defineProps<{
  title: string
  as?: 'h2' | 'h3'
  /** Anchor target, so links like /#contact land on the section. */
  id?: string
}>(), { as: 'h2', id: undefined })
</script>

<template>
  <component :is="as" :id="id" class="rule">
    {{ title }}
  </component>
</template>
