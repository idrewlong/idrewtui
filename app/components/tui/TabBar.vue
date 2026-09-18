<script setup lang="ts">
import { tabs } from '~/data/navigation'
import { profile } from '~/data/profile'
import { track } from '~/utils/analytics'

/**
 * A `<nav>` of links, not ARIA tabs: each tab is a separate page, so the
 * correct semantics are navigation + `aria-current="page"`.
 *
 * Sits inset in the frame's top border (see `.frame` in base.css).
 */
</script>

<template>
  <nav class="frame__bar tabbar" aria-label="Sections">
    <ul class="frame__label tabbar__list">
      <li v-for="tab in tabs" :key="tab.to">
        <NuxtLink
          class="tab"
          :to="tab.to"
          @click="track({ name: 'tab_switch', tab: tab.label })"
        >
          <span class="tab__key" aria-hidden="true">[{{ tab.key }}]</span>
          <span class="tab__label">{{ tab.label }}</span>
        </NuxtLink>
      </li>
    </ul>

    <span class="frame__gap" aria-hidden="true" />

    <a
      class="frame__label tab tab--resume"
      :href="profile.resumeUrl"
      target="_blank"
      rel="noopener"
      @click="track({ name: 'resume_download' })"
    >
      resume<span aria-hidden="true"> ↗</span>
      <span class="visually-hidden">(PDF, opens in a new tab)</span>
    </a>
  </nav>
</template>

<style scoped>
.tabbar__list {
  display: flex;
  align-items: center;
  gap: 0.75ch;
  min-width: 0;
  /* Size to content; the decorative `.frame__gap` (flex: 1) absorbs
     whatever room is left, shrinking to its own floor first. */
  flex: 0 1 auto;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4ch;
  min-height: 1.5rem;
  color: var(--muted);
  text-decoration: none;
  min-width: 0;
}
.tab:hover { color: var(--fg); }

.tab__key {
  display: none;
  color: var(--muted);
}

.tab[aria-current="page"] {
  color: var(--accent);
  font-weight: 600;
}
.tab[aria-current="page"] .tab__key { color: var(--accent); }
.tab[aria-current="page"] .tab__label { text-decoration: underline; }

.tab--resume { color: var(--link); flex-shrink: 0; }

@media (min-width: 48rem) {
  .tab__key { display: inline; }
  .tabbar__list { gap: 1.5ch; }
}
</style>
