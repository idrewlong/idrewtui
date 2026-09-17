import { onMounted, ref, watch, type Ref } from 'vue'
import type { Coords } from '~/composables/useGeolocation'

export interface Forecast {
  tempNow: number
  code: number
  /** Hourly temperatures, whole degrees. */
  hourly: number[]
  /** Hour-of-day of `hourly[0]`, for axis labels. */
  hourStart: number
  /**
   * Today's peak chance of precipitation, 0-100. `null` when the provider
   * omitted or malformed the field — never fabricated as 0, since an empty
   * bar would claim a known zero rather than "we don't know".
   */
  precipChance: number | null
}

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const CACHE_PREFIX = 'idrewlong:wx:'
const TTL_MS = 30 * 60 * 1000

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

/**
 * Open-Meteo payload to view model. Returns null for anything malformed rather
 * than letting NaN reach the panel.
 */
export function toForecast(payload: unknown): Forecast | null {
  if (!payload || typeof payload !== 'object') return null

  const p = payload as {
    current?: { temperature_2m?: unknown, weather_code?: unknown }
    hourly?: { time?: unknown, temperature_2m?: unknown, precipitation_probability?: unknown }
  }

  const temp = p.current?.temperature_2m
  const code = p.current?.weather_code
  const times = p.hourly?.time
  const temps = p.hourly?.temperature_2m
  const precip = p.hourly?.precipitation_probability

  if (!isNumber(temp) || !isNumber(code)) return null
  if (!Array.isArray(times) || !Array.isArray(temps)) return null
  if (times.length === 0 || times.length !== temps.length) return null
  if (!temps.every(isNumber)) return null

  const firstHour = /T(\d{2}):/.exec(String(times[0]))?.[1]
  if (firstHour === undefined) return null

  // Optional: Open-Meteo can omit this field, and a malformed one must not
  // sink the whole forecast — it just means "unknown chance of rain".
  const precipChance
    = Array.isArray(precip) && precip.length === times.length && precip.every(isNumber)
      ? Math.round(Math.max(...precip))
      : null

  return {
    tempNow: Math.round(temp),
    code,
    hourly: temps.map(t => Math.round(t)),
    hourStart: Number(firstHour),
    precipChance,
  }
}

export function cacheKey(c: Coords) {
  return `${CACHE_PREFIX}${c.lat},${c.lon}`
}

/**
 * Structural check on a *cached* `Forecast`, not a raw Open-Meteo payload —
 * `toForecast` can't be reused directly here because the shapes differ
 * (`hourly` is already a flat `number[]`, not `{ time, temperature_2m }`).
 *
 * This exists because `readCache` used to trust `JSON.parse`'s output
 * unconditionally: a cache entry written by an older deploy (before
 * `precipChance` existed) parses as valid JSON missing that field, and
 * without this check the panel rendered `chance of rain NaN%` — `undefined
 * !== null`, so the template's null guard never caught it. A shape mismatch
 * here must be treated exactly like a cache miss.
 */
export function isForecast(v: unknown): v is Forecast {
  if (!v || typeof v !== 'object') return false
  const f = v as Partial<Record<keyof Forecast, unknown>>
  return isNumber(f.tempNow)
    && isNumber(f.code)
    && Array.isArray(f.hourly) && f.hourly.every(isNumber)
    && isNumber(f.hourStart)
    && (f.precipChance === null || isNumber(f.precipChance))
}

export function readCache(c: Coords): Forecast | null {
  try {
    const raw = localStorage.getItem(cacheKey(c))
    if (!raw) return null

    const parsed = JSON.parse(raw) as { at?: unknown, forecast?: unknown }
    if (!isNumber(parsed.at) || Date.now() - parsed.at >= TTL_MS) return null

    // Revalidate rather than trust: a stale-shaped entry is a miss, not a
    // NaN-producing hit.
    return isForecast(parsed.forecast) ? parsed.forecast : null
  }
  catch {
    return null
  }
}

export function writeCache(c: Coords, forecast: Forecast) {
  try {
    localStorage.setItem(cacheKey(c), JSON.stringify({ at: Date.now(), forecast }))
  }
  catch {
    // Storage unavailable; we just refetch next time.
  }
}

/**
 * Current conditions and an hourly curve from Open-Meteo — free, no API key,
 * CORS-enabled. The only network request the site makes, and only coarsened
 * coordinates leave the browser.
 *
 * The fetch is deliberately started from `onMounted`, not from a bare
 * `watch(..., { immediate: true })` in setup — every other composable with a
 * side effect in this project (`useFrameRate`, `useBattery`,
 * `useVisitorSpecs`, `useGeolocation` itself, ...) gates it the same way,
 * because `setup()` also runs during SSR/prerendering. A watcher fired at
 * setup time is a fire-and-forget promise nothing awaits, but the
 * `fetch()` call inside it still gets dispatched for real: `nuxt generate`
 * (which every `pnpm test:e2e` run invokes to build the site it tests)
 * kept 5 real requests reaching api.open-meteo.com — one per prerendered
 * route — entirely outside any browser, so no Playwright route stub could
 * ever have caught it. `onMounted` never fires during SSR, so this runs
 * client-side only, exactly once real hydration happens.
 */
export function useWeather(coords: Ref<Coords>) {
  const forecast = ref<Forecast | null>(null)
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

  async function load(c: Coords) {
    const cached = readCache(c)
    if (cached) {
      forecast.value = cached
      status.value = 'ready'
      return
    }

    status.value = 'loading'
    const url = `${ENDPOINT}?latitude=${c.lat}&longitude=${c.lon}`
      + '&current=temperature_2m,weather_code'
      + '&hourly=temperature_2m,precipitation_probability&forecast_days=1'
      + '&temperature_unit=fahrenheit&timezone=auto'

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const parsed = toForecast(await response.json())
      if (!parsed) throw new Error('malformed payload')

      forecast.value = parsed
      status.value = 'ready'
      writeCache(c, parsed)
    }
    catch {
      status.value = 'error'
    }
  }

  onMounted(() => {
    watch(coords, load, { immediate: true })
  })

  return { forecast, status }
}
