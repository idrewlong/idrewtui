<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
 * The radar's width is measured, not fixed: a breakpoint-gated fixed size
 * either hid it below an arbitrarily high width (most real windows are
 * narrower than that) or, above it, rendered identically small even on a
 * very wide screen, which read as speckle rather than a picture. Instead
 * `radarSlotRef` (a flex sibling of the temperature chart, `flex: 1`) is
 * measured with a `ResizeObserver`; its pixel width, divided by an actually
 * measured monospace character width (not assumed), gives `radarCols`,
 * which `useRadar` re-renders from its already-cached tile pixels — no
 * network involved in a resize. `radarCols` is clamped: below
 * `MIN_RADAR_COLS` there genuinely isn't room for a legible grid, so it
 * does not render at all rather than showing a token sliver (this is what
 * naturally hides it on a narrow, single-column mobile layout, with no
 * separate breakpoint rule needed); above `MAX_RADAR_COLS` it stops
 * growing, because the source tile is only 256px wide — asking for more
 * columns than that starts repeating the same source pixel across
 * adjacent cells rather than showing real extra detail, which reads as
 * blocky, not sharp.
 *
 * `rows` is 13 — re-measured (not assumed) for the radar's own fixed
 * `RADAR_CELL_ROWS` (8 braille rows, i.e. 32 dot-rows — "a picture", not a
 * 3-row strip) at 1000/1200/1366/1500/2000px; see the measurement notes
 * next to `RADAR_CELL_ROWS` below and the e2e coverage for the numbers.
 * `RADAR_CELL_ROWS` is a constant, not derived from measured height —
 * unlike width, height must stay identical at every viewport for the
 * fixed-height/zero-CLS guarantee to hold, so only the column count is
 * ever measured live.
 */
const { coords } = useGeolocation()
const { forecast, status } = useWeather(coords)

const MIN_RADAR_COLS = 10
const MAX_RADAR_COLS = 120
// 8 rows (32 dot-rows) reads as a real shape rather than a thin strip, and
// is what `rows` below was re-measured against.
const RADAR_CELL_ROWS = 8
// Matches the `.radar` box's own CSS: a 1px border and 0.75ch of padding on
// each side. Kept in sync with the <style> block below by hand — there is
// no cheaper way to know it before layout without extra reflows.
const RADAR_BORDER_PX = 1
const RADAR_PADDING_CH = 0.75

const radarSlotRef = ref<HTMLElement | null>(null)
const radarCols = ref(0)
const radarFits = computed(() => radarCols.value >= MIN_RADAR_COLS)

let charWidthPx: number | null = null
let resizeObserver: ResizeObserver | undefined

/** Measures the actual rendered advance width of one monospace character. */
function measureCharWidthPx(sampleEl: HTMLElement): number {
  const probe = document.createElement('span')
  const style = getComputedStyle(sampleEl)
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.whiteSpace = 'pre'
  probe.style.fontFamily = style.fontFamily
  probe.style.fontSize = style.fontSize
  probe.textContent = '0'.repeat(40)
  document.body.appendChild(probe)
  const width = probe.getBoundingClientRect().width / 40
  probe.remove()
  return width
}

function recomputeRadarCols() {
  const el = radarSlotRef.value
  if (!el) return
  charWidthPx ??= measureCharWidthPx(el)
  if (!charWidthPx) return

  const innerPx = el.clientWidth - (2 * RADAR_BORDER_PX) - (2 * RADAR_PADDING_CH * charWidthPx)
  // One character of safety margin against rounding/antialiasing at the edge.
  const cols = Math.floor(innerPx / charWidthPx) - 1
  radarCols.value = Math.max(0, Math.min(MAX_RADAR_COLS, cols))
}

onMounted(() => {
  recomputeRadarCols()
  if (radarSlotRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => recomputeRadarCols())
    resizeObserver.observe(radarSlotRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

const {
  status: radarStatus,
  rows: radarRows,
  coveragePercent: radarCoverage,
  frameAt: radarFrameAt,
} = useRadar(coords, radarCols, RADAR_CELL_ROWS)

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
  <TuiPanel :title="`wx · ${coords.label}`" :rows="13">
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
        to freeze under prefers-reduced-motion. `radar-slot` is always
        present (so it can always be measured for a future resize); the
        bordered `.radar` box only renders once there is measured room for
        at least `MIN_RADAR_COLS` — genuinely narrow widths (a stacked
        mobile layout) end up with nothing here rather than a token sliver,
        and leave no gap since the slot itself has no border or padding.
      -->
      <div ref="radarSlotRef" class="radar-slot">
        <div v-if="radarFits" class="radar">
          <span class="radar__label">
            radar<template v-if="radarStatus === 'ready'"> · {{ radarTimeLabel }}</template>
          </span>
          <pre v-if="radarStatus === 'ready'" class="radar__rows" aria-hidden="true">{{ radarRows.join('\n') }}</pre>
          <span v-else-if="radarStatus === 'error'" class="radar__none">unavailable</span>
          <span v-else class="radar__none">—</span>
          <span class="visually-hidden">{{ radarSummary }}</span>
        </div>
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
 * Fills whatever width is left beside the temperature chart. `min-width: 0`
 * lets it shrink below its content's natural size instead of forcing the
 * row to overflow on a narrow panel — `radarCols` (computed in <script>)
 * is what actually keeps the rendered grid inside this box.
 */
.radar-slot {
  flex: 1 1 0;
  min-width: 0;
}

/*
 * A bordered sub-block, same inset-title-on-the-border technique as
 * TuiPanel itself (`.panel::before` + a same-background label sitting on
 * the line) — the point is to make it unmistakably a second, separate
 * graphic next to the temperature chart rather than an unbounded run of
 * braille glyphs immediately after it.
 */
.radar {
  position: relative;
  isolation: isolate;
  border: 1px solid var(--line);
  padding: 0.7em 0.75ch 0.5em;
}
.radar__label {
  position: absolute;
  top: -0.7em;
  left: 0.75ch;
  background: var(--surface);
  padding: 0 0.5ch;
  color: var(--muted);
  white-space: nowrap;
}
.radar__rows {
  margin: 0;
  /* Deliberately not --accent: the temperature chart already uses it, and
     the two braille blocks sitting right next to each other in the same
     colour is exactly what made the radar unreadable as a separate
     graphic. --link gives it its own, contrasting identity. */
  color: var(--link);
  line-height: 1;
  font-family: var(--font-mono);
  white-space: pre;
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
