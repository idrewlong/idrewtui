<script setup lang="ts">
import { DEFAULT_DARK, DEFAULT_LIGHT, THEME_NAMES, THEME_STORAGE_KEY } from '~/composables/useTheme'

/**
 * Runs before first paint, because both things it sets would otherwise cause a
 * visible flash or a layout shift:
 *
 * - `data-theme`: a static build can't know the visitor's choice at build time,
 *   so without this the page paints the wrong palette first. Mirrors
 *   `resolveTheme()`.
 * - `data-js`: gates `.js-only` controls. Deciding this here rather than on
 *   mount keeps them from popping in after hydration and shifting layout.
 *
 * This is the only inline script on the site.
 */
const themeScript = `
(function(){var d=document.documentElement;d.dataset.js='true';try{
var names=${JSON.stringify(THEME_NAMES)};
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
d.dataset.theme=names.indexOf(s)>-1?s:(matchMedia('(prefers-color-scheme: light)').matches?${JSON.stringify(DEFAULT_LIGHT)}:${JSON.stringify(DEFAULT_DARK)});
}catch(e){d.dataset.theme=${JSON.stringify(DEFAULT_DARK)}}})();
`.trim()

useHead({
  script: [{ innerHTML: themeScript, tagPosition: 'head' }],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
