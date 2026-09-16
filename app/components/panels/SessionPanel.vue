<script setup lang="ts">
import { useClock } from '~/composables/useClock'
import { useSession } from '~/composables/useSession'

/**
 * Clock, time-on-page, current route, view count, and a log of real router
 * navigations (timings measured with performance.now() — see useSession).
 *
 * `rows` is sized for the log at its cap (5 entries, `MAX_LOG` in
 * useSession.ts): the log grows as the visitor navigates, so sizing for the
 * empty state would clip once someone has moved around — a clipping bug that
 * only appears after interaction and would escape a static review.
 */
const { uptime, route, visited, log } = useSession()
const { time } = useClock()
</script>

<template>
  <TuiPanel title="session" :rows="10">
    <dl class="kv">
      <dt>time</dt><dd aria-live="off">{{ time }}</dd>
      <dt>uptime</dt><dd aria-live="off">{{ uptime }}</dd>
      <dt>route</dt><dd>{{ route }}</dd>
      <dt>views</dt><dd>{{ visited }}</dd>
    </dl>

    <ul class="log" aria-label="Recent navigations">
      <li v-for="(entry, i) in log" :key="`${entry.path}-${i}`" class="log__row">
        <span class="log__method">{{ entry.method }}</span>
        <span class="log__path">{{ entry.path }}</span>
        <span class="log__status">{{ entry.status }}</span>
        <span class="log__ms">{{ entry.ms }}ms</span>
      </li>
    </ul>
  </TuiPanel>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 7ch 1fr;
  gap: 0 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd {
  color: var(--fg);
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log { margin: 0.25rem 0 0; padding: 0; list-style: none; display: grid; gap: 0; }

.log__row {
  display: flex;
  gap: 1ch;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
}
.log__method { color: var(--link); }
.log__path {
  color: var(--fg);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.log__status { color: var(--accent); }
.log__ms { margin-left: auto; }
</style>
