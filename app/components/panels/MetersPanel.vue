<script setup lang="ts">
import { computed } from 'vue'
import { useBattery } from '~/composables/useBattery'
import { useFrameRate } from '~/composables/useFrameRate'
import { useMemoryMeter } from '~/composables/useMemoryMeter'
import { useNetworkInfo } from '~/composables/useNetworkInfo'

/**
 * Live browser-side telemetry. Deliberately not a fake CPU meter: the platform
 * does not expose process load, and inventing it would be dishonest. These are
 * all measured, and each row degrades to an honest `—` when the browser does
 * not expose the underlying signal (Safari/Firefox lack `performance.memory`
 * and `navigator.connection`; `getBattery()` can reject on any browser).
 *
 * Uptime is not shown here — it belongs to the session panel (Task 7).
 */
const { fps, history } = useFrameRate()
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
  <TuiPanel title="meters" :rows="6">
    <dl class="kv">
      <dt>fps</dt>
      <dd><TuiSparkline :values="history" unit="fps" :min="0" :max="120" /> {{ fps || '—' }}</dd>

      <dt>heap</dt>
      <dd>
        <template v-if="memory.supported.value">
          <TuiBarMeter :fraction="memory.fraction.value" label="JS heap used" /> {{ memory.usedMb.value }}M
        </template>
        <span v-else class="kv__none">— unavailable</span>
      </dd>

      <dt>net</dt>
      <dd>{{ netLine }}</dd>

      <dt>rtt</dt>
      <dd>{{ net.rtt.value !== null ? `${net.rtt.value}ms` : '—' }}</dd>

      <dt>batt</dt>
      <dd :class="{ kv__none: batteryLine === '—' }">{{ batteryLine }}</dd>
    </dl>
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
</style>
