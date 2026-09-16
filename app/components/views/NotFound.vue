<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { tabs } from '~/data/navigation'

/**
 * The 404 body, in the shape of a shell error (docs/PROJECT.md §4.6).
 *
 * Shared by `app/pages/404.vue` (prerendered to the static `404.html` a host
 * serves for unknown paths) and `app/error.vue` (runtime and client-side
 * navigation errors), so the two can never drift apart.
 *
 * One `404.html` is shared by every bad URL, so the path can't be baked in at
 * build time: it's filled in on mount and omitted otherwise, and the sentence
 * reads correctly either way.
 */
const props = withDefaults(defineProps<{
  /** Known path, when the server can supply one. */
  path?: string
  message?: string
}>(), { path: '', message: 'No such file or directory' })

const shown = ref(props.path)

onMounted(() => {
  if (!shown.value) shown.value = window.location.pathname
})
</script>

<template>
  <div>
    <h1 class="error">
      <span class="visually-hidden">Page not found</span>
      <span aria-hidden="true"><span class="error__cmd">bash: </span><span
        v-if="shown"
        class="error__path"
      >{{ shown }}</span><template v-if="shown">: </template><span class="error__msg">{{ message }}</span></span>
    </h1>

    <p class="hint">Try one of these:</p>

    <ul class="links">
      <li v-for="tab in tabs" :key="tab.to">
        <NuxtLink class="link" :to="tab.to">
          <span class="link__key" aria-hidden="true">[{{ tab.key }}]</span>
          <span>{{ tab.label }}</span>
          <span class="link__path glyph" aria-hidden="true">{{ tab.to }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.error {
  font-size: var(--text-prompt);
  font-weight: 400;
  margin-bottom: 1.25rem;
  overflow-wrap: anywhere;
}
.error__cmd { color: var(--muted); }
.error__path { color: var(--danger); }
.error__msg { color: var(--fg); }

.hint { color: var(--muted); margin-bottom: 0.75rem; }

.links { display: grid; gap: 0.25rem; }

.link {
  display: inline-flex;
  gap: 1ch;
  align-items: baseline;
  text-decoration: none;
  color: var(--fg);
  padding: 0.15rem 0.25rem;
}
.link:hover { color: var(--accent); }
.link__key { color: var(--accent); }
.link__path { font-size: var(--text-status); }
</style>
