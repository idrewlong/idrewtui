<script setup lang="ts">
import { computed } from 'vue'
import { useGeolocation } from '~/composables/useGeolocation'
import { useRadar } from '~/composables/useRadar'
import { useWeather } from '~/composables/useWeather'
import { moonPhase, sunTimes } from '~/utils/sun'
import { describeWeatherCode } from '~/utils/weather-codes'

/**
 * Weather, sun, moon and a small precipitation radar. Geolocation is
 * requested on load; denial silently keeps the fallback location, with no
 * error state.
 *
 * Sun and moon are computed locally (`~/utils/sun`), so they render even when
 * the forecast request fails — this panel makes the site's network
 * requests, and losing one must not lose the others' content.
 *
 * The radar (`~/composables/useRadar`) only renders at the >=75rem
 * breakpoint (see `.radar` below) — that is the one breakpoint at which
 * this panel is actually wide enough to have unused space beside the
 * temperature chart (~949px wide there, per the panel's own measured
 * layout; a single narrower column the rest of the time). Below that
 * breakpoint the radar block does not render at all, so it never
 * contributes to `rows` there and can never wrap onto a new line.
 *
 * `rows` is still 9 after adding the radar — re-measured (not assumed) with
 * the radar in place, using the same "force the body's height to `auto` and
 * read the true `scrollHeight`" technique across widths 1366, 1201-393
 * (spanning the >=75rem radar breakpoint and the Pixel 5's 393px), plus
 * the original 768x1024 check: natural content height tops out at 186px in
 * every one of those states, against `rows=9`'s fixed 187px body. The one
 * caveat: the privacy line naming both open-meteo.org and rainviewer.com
 * had to stay terse ("+ rainviewer.com" rather than a full sentence) — an
 * earlier, wordier draft wrapped to a third line at medium widths and
 * pushed natural height to 207px, which `rows=9` clips by 20px. `rows=8`
 * (166px) still fits the widest state exactly but clips mobile, same as
 * before this change.
 */
const { coords } = useGeolocation()
const { forecast, status } = useWeather(coords)
const { status: radarStatus, rows: radarRows, coveragePercent: radarCoverage, frameAt: radarFrameAt } = useRadar(coords)

const conditions = computed(() =>
  forecast.value ? describeWeatherCode(forecast.value.code) : '—')

const sun = computed(() => sunTimes(new Date(), coords.value.lat, coords.value.lon))
const moon = computed(() => moonPhase(new Date()))

function hhmm(date: Date | null): string {
  return date ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
}

const radarTimeLabel = computed(() => hhmm(radarFrameAt.value))

/**
 * Distinguishes "no precipitation in view" (a real reading: status is
 * `ready` and coverage genuinely computed to 0) from "could not load"
 * (status is `error`) — these must read differently, never the same blank
 * grid implying a false "all clear".
 */
const radarSummary = computed(() => {
  if (radarStatus.value === 'ready') {
    return `Precipitation radar near ${coords.value.label}, frame from ${radarTimeLabel.value}: `
      + `${radarCoverage.value}% of the area shown has radar-detected precipitation.`
  }
  if (radarStatus.value === 'error') return 'Precipitation radar: could not be loaded.'
  return 'Precipitation radar: loading.'
})
</script>

<template>
  <TuiPanel :title="`wx · ${coords.label}`" :rows="9">
    <p class="now">
      <span class="now__temp">{{ forecast ? `${forecast.tempNow}°F` : '—' }}</span>
      <span class="now__cond">{{ conditions }}</span>
      <span v-if="status === 'error'" class="now__note">forecast unavailable</span>
    </p>

    <div class="chart-row">
      <TuiBrailleChart
        v-if="forecast"
        :values="forecast.hourly"
        unit="°F"
        label="Hourly temperature"
        :width="26"
        :height="3"
      />

      <!--
        Static, latest-frame-only radar: no animation, so there is nothing
        to freeze under prefers-reduced-motion. Only rendered at >=75rem
        (see .radar below), the one breakpoint where this panel actually
        has unused width beside the chart.
      -->
      <div class="radar">
        <span class="radar__label">
          radar<template v-if="radarStatus === 'ready'"> · {{ radarTimeLabel }}</template>
        </span>
        <pre v-if="radarStatus === 'ready'" class="radar__rows" aria-hidden="true">{{ radarRows.join('\n') }}</pre>
        <span v-else-if="radarStatus === 'error'" class="radar__none">unavailable</span>
        <span v-else class="radar__none">—</span>
        <span class="visually-hidden">{{ radarSummary }}</span>
      </div>
    </div>

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
      approx. coords (~1km) sent to open-meteo.org + rainviewer.com
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

.chart-row {
  display: flex;
  align-items: flex-start;
  gap: 2ch;
}

/*
 * Only shown at the one breakpoint where this panel is actually wide
 * enough to have unused space beside the temperature chart (see the
 * >=75rem dashboard grid tier in base.css, where wx spans two columns).
 * Below that it simply does not render, so it can never wrap onto a new
 * line and grow the panel's fixed height.
 */
.radar { display: none; }

@media (min-width: 75rem) {
  .radar { display: block; }
}

.radar__label {
  display: block;
  color: var(--muted);
  margin: 0 0 0.15rem;
}
.radar__rows {
  margin: 0;
  color: var(--accent);
  line-height: 1;
  font-family: var(--font-mono);
}
.radar__none { color: var(--muted); }

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
