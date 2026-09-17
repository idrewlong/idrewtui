<script setup lang="ts">
import { computed } from 'vue'
import { useBattery } from '~/composables/useBattery'
import { formatFps, useFrameRate } from '~/composables/useFrameRate'
import { useMemoryMeter } from '~/composables/useMemoryMeter'
import { formatRtt, useNetworkInfo } from '~/composables/useNetworkInfo'

/**
 * Live browser-side telemetry. Deliberately not a fake CPU meter: the platform
 * does not expose process load, and inventing it would be dishonest. These are
 * all measured, and each row degrades to an honest `—` when the browser does
 * not expose the underlying signal (Safari/Firefox lack `performance.memory`
 * and `navigator.connection`; `getBattery()` can reject on any browser).
 *
 * Uptime is not shown here — it belongs to the session panel (Task 7).
 *
 * `rows` is 10. The frame-time chart added below the kv rows measures 189px
 * tall (headless Chromium, both the 1366x768 and 393-wide Pixel 5
 * viewports — the chart's char width is fixed, so it does not vary with
 * viewport). `rows=9` (187px) clips it by 2px; `rows=10` (208px) does not,
 * confirmed via `.panel__body` scrollHeight/clientHeight with no overflow in
 * either dimension, checked again after 5s (multiple frame-time windows)
 * and under `prefers-reduced-motion: reduce`, in all cases with no height
 * change between pre-hydration and post-hydration.
 */
const { fps, history, frameTimeHistory } = useFrameRate()
const memory = useMemoryMeter()
const net = useNetworkInfo()
const battery = useBattery()

const netLine = computed(() => {
  if (!net.supported.value) return net.online.value ? 'online' : 'offline'
  const parts = [
    net.downlink.value !== null ? `↓${net.downlink.value}Mbps` : null,
    net.effectiveType.value,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'online'
})

const batteryLine = computed(() =>
  battery.supported.value && battery.level.value !== null
    ? `${Math.round(battery.level.value * 100)}%${battery.charging.value ? ' ⚡' : ''}`
    : '—')
</script>

<template>
  <TuiPanel title="meters" :rows="10">
    <dl class="kv">
      <dt>fps</dt>
      <dd><TuiSparkline :values="history" unit="fps" :min="0" :max="120" /> {{ formatFps(fps) }}</dd>

      <dt>heap</dt>
      <dd>
        <template v-if="memory.supported.value && memory.usedMb.value !== null">
          <TuiSparkline :values="memory.history.value" unit="MB" /> {{ memory.usedMb.value }}M
        </template>
        <span v-else-if="memory.supported.value" class="kv__none">—</span>
        <span v-else class="kv__none">— unavailable</span>
      </dd>

      <dt>net</dt>
      <dd>{{ netLine }}</dd>

      <dt>rtt</dt>
      <dd>{{ formatRtt(net.rtt.value) }}</dd>

      <dt>batt</dt>
      <dd :class="{ kv__none: batteryLine === '—' }">{{ batteryLine }}</dd>
    </dl>

    <!--
      Frame time, not fps: fps is pinned at the display refresh rate almost
      always and graphs as a flat line, whereas frame time sits near 16.7ms
      and spikes visibly when the main thread stalls — same rAF measurement
      (useFrameRate), more useful shape. Not a live region: it ticks once a
      second and a graph that announces itself that often is unusable with a
      screen reader; the visually-hidden summary inside TuiBrailleChart is
      still there for anyone who wants the numbers.
    -->
    <div class="frametime">
      <span class="frametime__label" aria-hidden="true">frametime ms</span>
      <TuiBrailleChart
        :values="frameTimeHistory"
        unit="ms"
        label="frame time"
        :width="28"
        :height="2"
      />
    </div>
  </TuiPanel>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 5ch 1fr;
  gap: 0 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd { color: var(--fg); margin: 0; white-space: nowrap; overflow: hidden; }
.kv__none { color: var(--muted); }

.frametime {
  margin: 0.5rem 0 0;
}
.frametime__label {
  display: block;
  color: var(--muted);
  margin: 0 0 0.15rem;
}
</style>
