<script setup lang="ts">
import { THEME_STORAGE_KEY } from '~/composables/useTheme'

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
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var t=(s==='dark'||s==='light')?s:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
d.dataset.theme=t;
}catch(e){}})();
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
