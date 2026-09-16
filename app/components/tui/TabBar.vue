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
  gap: 1ch;
  /* Guard: never let a long label push the resume link out of the frame. */
  overflow: hidden;
}

/* Vertical padding enlarges the touch target without changing the bar height. */
.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4ch;
  min-height: 1.5rem;
  color: var(--muted);
  text-decoration: none;
}
.tab:hover { color: var(--fg); }

.tab__key { color: var(--muted); }

/* Active tab: amber, and the marker is never colour alone. */
.tab[aria-current="page"] {
  color: var(--accent);
  font-weight: 600;
}
.tab[aria-current="page"] .tab__key { color: var(--accent); }
.tab[aria-current="page"] .tab__label { text-decoration: underline; }

.tab--resume { color: var(--link); }

/*
 * The [n] prefixes are keyboard affordances. On touch widths they are noise and
 * they cost ~16 characters, which is the difference between the bar fitting on
 * a 360px screen and wrapping out of the border.
 */
.tab__key { display: none; }

@media (min-width: 40rem) {
  .tab__key { display: inline; }
  .tabbar__list { gap: 1.5ch; }
}
</style>
