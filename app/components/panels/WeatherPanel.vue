<script setup lang="ts">
import { computed } from 'vue'
import { useGeolocation } from '~/composables/useGeolocation'
import { useWeather } from '~/composables/useWeather'
import { moonPhase, sunTimes } from '~/utils/sun'
import { describeWeatherCode } from '~/utils/weather-codes'

/**
 * Weather, sun and moon. Geolocation is requested on load; denial silently
 * keeps the fallback location, with no error state.
 *
 * Sun and moon are computed locally (`~/utils/sun`), so they render even when
 * the forecast request fails — this panel makes the site's only network
 * request, and losing it must not lose the astro line too.
 *
 * `rows` is 9. Measured in headless Chromium at the panel's tallest realistic
 * state — a full 24-point hourly braille chart plus a known precipitation
 * chance, at three breakpoints (1366x768, 768x1024, and the Pixel 5's
 * 393-wide viewport where the privacy caveat line wraps to two lines):
 * natural content height 166-186px depending on width, against `rows=9`'s
 * fixed 187px body — no clipping, no meaningful waste. `rows=8` (166px)
 * fits desktop exactly but clips the caveat text by ~20px on mobile.
 */
const { coords } = useGeolocation()
const { forecast, status } = useWeather(coords)

const conditions = computed(() =>
  forecast.value ? describeWeatherCode(forecast.value.code) : '—')

const sun = computed(() => sunTimes(new Date(), coords.value.lat, coords.value.lon))
const moon = computed(() => moonPhase(new Date()))

function hhmm(date: Date | null): string {
  return date ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
}
</script>

<template>
  <TuiPanel :title="`wx · ${coords.label}`" :rows="9">
    <p class="now">
      <span class="now__temp">{{ forecast ? `${forecast.tempNow}°F` : '—' }}</span>
      <span class="now__cond">{{ conditions }}</span>
      <span v-if="status === 'error'" class="now__note">forecast unavailable</span>
    </p>

    <TuiBrailleChart
      v-if="forecast"
      :values="forecast.hourly"
      unit="°F"
      label="Hourly temperature"
      :width="26"
      :height="3"
    />

    <p class="precip">
      <span class="precip__label">rain</span>
      <TuiBarMeter
        v-if="forecast && forecast.precipChance !== null"
        :fraction="forecast.precipChance / 100"
        :width="10"
        label="chance of rain"
      />
      <span v-else class="precip__none">—</span>
    </p>

    <p class="astro">
      <span><span aria-hidden="true">☀ </span>{{ hhmm(sun.sunrise) }}</span>
      <span><span aria-hidden="true">☽ </span>{{ hhmm(sun.sunset) }}</span>
      <span><span aria-hidden="true">☾ </span>{{ moon.name }}</span>
    </p>

    <p class="caveat">
      approx. coords (~1km) sent to open-meteo.org for this forecast
    </p>
  </TuiPanel>
</template>

<style scoped>
.now {
  display: flex;
  gap: 1.5ch;
  align-items: baseline;
  margin: 0 0 0.25rem;
}
.now__temp { color: var(--accent); font-weight: 600; font-size: var(--text-name); }
.now__cond { color: var(--fg); }
.now__note { color: var(--muted); }

.precip {
  display: flex;
  gap: 1ch;
  align-items: baseline;
  margin: 0.25rem 0 0;
}
.precip__label { color: var(--muted); }
.precip__none { color: var(--muted); }

.astro {
  display: flex;
  gap: 2ch;
  flex-wrap: wrap;
  margin: 0.25rem 0 0;
  color: var(--muted);
}

.caveat {
  margin: 0.35rem 0 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}
</style>
