<script setup lang="ts">
import { profile } from '~/data/profile'
import { certifications } from '~/data/skills'
import { track } from '~/utils/analytics'

/**
 * The recruiter panel. Prerendered from `app/data`, so it is correct with
 * JavaScript disabled and it is the first thing in the DOM.
 *
 * Values wrap rather than truncate — every certification and every stack
 * entry must be readable, at every width. `rows` is raised to whatever this
 * content needs at its narrowest occupied column (measured at 375/768/1024/
 * 1366/1920) rather than clipping it; the panel is fully prerendered and
 * never changes after hydration, so a taller fixed height costs zero CLS.
 *
 * The ASCII mark is hidden below 90rem: at every grid column width this
 * panel occupies up to that point, showing it would either stack above the
 * key/value list (costing extra fixed-height rows on every width, not just
 * the one that needs them) or sit beside it and squeeze it back toward the
 * truncation this component exists to avoid. It only appears once the panel
 * is wide enough to hold both without touching the required `rows`.
 */
const certLine = certifications
  .map(c => (c.status === 'in-progress' ? `${c.name} (in progress)` : c.name))
  .join(' · ')
</script>

<template>
  <TuiPanel title="whoami" :rows="14">
    <div class="whoami">
      <TuiAsciiArt class="whoami__art" />

      <div class="whoami__info">
        <dl class="kv">
          <dt>Role</dt><dd>{{ profile.role }}</dd>
          <dt>Org</dt><dd>{{ profile.employer }}</dd>
          <dt>Loc</dt><dd>{{ profile.location }}</dd>
          <dt>Stack</dt><dd>{{ profile.stack.join(' · ') }}</dd>
          <dt>Certs</dt><dd>{{ certLine }}</dd>
        </dl>

        <a
          class="resume"
          :href="profile.resumeUrl"
          target="_blank"
          rel="noopener"
          @click="track({ name: 'resume_download' })"
        >
          [ resume ↓ ]<span class="visually-hidden"> (PDF, opens in a new tab)</span>
        </a>
      </div>
    </div>
  </TuiPanel>
</template>

<style scoped>
.whoami {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.5rem 1.25rem;
}

/* Hidden below the width where it would stack above the key/value list and
   cost extra fixed-height rows, or sit beside it and squeeze it back toward
   truncation. Shown only once the panel is comfortably wide. */
.whoami__art { display: none; }

.whoami__info { min-width: 0; }

@media (min-width: 90rem) {
  .whoami__art { display: block; flex: 0 0 auto; }
  .whoami__info { flex: 1 1 16rem; }
}

.kv {
  display: grid;
  grid-template-columns: 6ch 1fr;
  gap: 0.15rem 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd {
  color: var(--fg);
  margin: 0;
  min-width: 0;
  /* Wrap, never truncate: every certification and stack entry must stay
     readable. Long unbreakable tokens still break rather than overflow. */
  overflow-wrap: anywhere;
}

.resume {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  margin-top: 0.25rem;
  color: var(--accent);
  text-decoration: none;
}
.resume:hover { text-decoration: underline; }
</style>
