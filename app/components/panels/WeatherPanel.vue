<script setup lang="ts">
import { computed } from 'vue'
import { useGeolocation } from '~/composables/useGeolocation'
import { useWeather } from '~/composables/useWeather'
import { moonPhase, sunTimes } from '~/utils/sun'
import { asciiWeather, describeWeatherCode } from '~/utils/weather-codes'

/**
 * Compact forecast card: ASCII glyph plus key/values.
 * Geolocation is requested on load; denial silently keeps the fallback.
 */
const { coords } = useGeolocation()
const { forecast, status } = useWeather(coords)

const conditions = computed(() =>
  forecast.value ? describeWeatherCode(forecast.value.code) : '—')

const art = computed(() => asciiWeather(forecast.value?.code ?? 3))

const sun = computed(() => sunTimes(new Date(), coords.value.lat, coords.value.lon))
const moon = computed(() => moonPhase(new Date()))

function hhmm(date: Date | null): string {
  return date ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
}

const precipLabel = computed(() => {
  if (!forecast.value || forecast.value.precipChance === null) return '—'
  return `${forecast.value.precipChance}%`
})
</script>

<template>
  <TuiPanel :title="`wx · ${coords.label}`" :rows="9">
    <div class="wx">
      <p class="wx__heading">
        Forecast for {{ coords.label }}
        <span v-if="status === 'error'" class="wx__note">forecast unavailable</span>
      </p>

      <div class="wx__facts">
        <pre class="wx__art" aria-hidden="true">{{ art }}</pre>
        <dl class="wx__kv">
          <div class="wx__row">
            <dt>weather</dt>
            <span class="wx__chev" aria-hidden="true">&gt;</span>
            <dd>{{ conditions }}<template v-if="forecast"> ({{ forecast.tempNow }}°F)</template></dd>
          </div>
          <div class="wx__row">
            <dt>sunset</dt>
            <span class="wx__chev" aria-hidden="true">&gt;</span>
            <dd>{{ hhmm(sun.sunset) }}</dd>
          </div>
          <div class="wx__row">
            <dt>precip</dt>
            <span class="wx__chev" aria-hidden="true">&gt;</span>
            <dd>{{ precipLabel }}</dd>
          </div>
          <div class="wx__row">
            <dt>moon</dt>
            <span class="wx__chev" aria-hidden="true">&gt;</span>
            <dd>{{ moon.name }}</dd>
          </div>
        </dl>
      </div>

      <p class="caveat">
        approx. coords (~1km) sent to open-meteo.org
      </p>
    </div>
  </TuiPanel>
</template>

<style scoped>
.wx {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.wx__heading {
  margin: 0 0 0.35rem;
  color: var(--accent);
  font-weight: 600;
}
.wx__note {
  margin-left: 1ch;
  color: var(--muted);
  font-weight: 400;
}

.wx__facts {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1ch 1.5ch;
  align-items: center;
  min-width: 0;
}

.wx__art {
  margin: 0;
  color: var(--link);
  line-height: 1.15;
  font-size: var(--text-status);
}

.wx__kv {
  display: grid;
  gap: 0.05rem;
  min-width: 0;
}
.wx__row {
  display: grid;
  grid-template-columns: 8ch 1.5ch minmax(0, 1fr);
  align-items: baseline;
  min-width: 0;
}
.wx__row dt {
  color: var(--muted);
  font-weight: 400;
}
.wx__chev { color: var(--accent); }
.wx__row dd {
  margin: 0;
  color: var(--fg);
  min-width: 0;
  overflow-wrap: anywhere;
}

.caveat {
  margin: 0.35rem 0 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}
</style>
