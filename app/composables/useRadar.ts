import { isRef, onMounted, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import type { Coords } from '~/composables/useGeolocation'
import {
  alphaGridFromPixels,
  averageDensity,
  densityToBraille,
  latestRadarFrame,
  latLonToTile,
  radarTileUrl,
  type RadarFrame,
} from '~/utils/radar'

const INDEX_ENDPOINT = 'https://api.rainviewer.com/public/weather-maps.json'
const INDEX_CACHE_KEY = 'idrewlong:radar-index'
// RainViewer publishes a new frame roughly every 10 minutes; 5 avoids
// refetching the index on every mount while staying well within that.
const INDEX_TTL_MS = 5 * 60 * 1000
// Matches the zoom level the coverage figures in the composable's own
// tests/docs were measured at (Long Beach MS 8.4%, Seattle 5.9%, Singapore
// 7.5%) — small tiles, plenty of resolution for a "small radar" glyph grid.
const ZOOM = 5
const TILE_PX = 256

export type RadarStatus = 'idle' | 'loading' | 'ready' | 'error'

function readIndexCache(): RadarFrame | null {
  try {
    const raw = localStorage.getItem(INDEX_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { at?: unknown, frame?: unknown }
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at >= INDEX_TTL_MS) return null

    const frame = parsed.frame
    if (!frame || typeof frame !== 'object') return null
    const f = frame as Partial<RadarFrame>
    if (typeof f.host !== 'string' || typeof f.path !== 'string' || typeof f.time !== 'number') return null

    return { host: f.host, path: f.path, time: f.time }
  }
  catch {
    return null
  }
}

function writeIndexCache(frame: RadarFrame) {
  try {
    localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify({ at: Date.now(), frame }))
  }
  catch {
    // Storage unavailable; we just refetch next time.
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // The confirmed reason getImageData below does not throw for a
    // cross-origin tile: RainViewer tiles serve `access-control-allow-origin:
    // *`, so a `crossOrigin`-tagged load does not taint the canvas.
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('radar tile failed to load'))
    img.src = url
  })
}

/**
 * A small, static precipitation radar for the weather panel, from
 * RainViewer (free, no API key, CORS-enabled tiles) — the latest frame
 * only, never animated: simpler, and it sidesteps `prefers-reduced-motion`
 * entirely rather than needing to freeze a running animation.
 *
 * Every failure — the frame-index fetch, the tile request, decoding it,
 * reading its pixels — is a non-event: `status` becomes `'error'` and the
 * panel renders an honest "radar unavailable", never a fabricated or
 * blank-but-implied-clear grid. That is a different, distinguishable state
 * from `status === 'ready'` with `coveragePercent === 0`, which is a real,
 * legitimate "no precipitation in view" reading computed from actual pixel
 * data.
 *
 * The fetch is started from `onMounted`, not a bare `watch(...,
 * { immediate: true })` in setup — see `useWeather` for why a network call
 * in `setup()` gets dispatched for real during `nuxt generate`, entirely
 * outside any browser Playwright could stub.
 *
 * `cellCols` may be a plain number or a `Ref`/getter — the panel measures
 * its actual available width and updates it live as the window resizes, so
 * the grid always fills the space it's given rather than rendering at one
 * hardcoded size regardless of viewport. Changing it re-renders from the
 * tile's pixel data, which is cached after the first successful load — a
 * resize never re-fetches the network or re-decodes the image, only
 * re-runs the pure `alphaGridFromPixels`/`densityToBraille` transform.
 */
export function useRadar(coords: Ref<Coords>, cellCols: MaybeRefOrGetter<number> = 20, cellRows = 3) {
  const status = ref<RadarStatus>('idle')
  const rows = ref<string[]>([])
  const coveragePercent = ref<number | null>(null)
  const frameAt = ref<Date | null>(null)

  // The raw pixel buffer from the last successful tile load. Kept only so a
  // column-count change can re-render without re-fetching; never exposed.
  let cachedPixels: Uint8ClampedArray | null = null

  function renderFromCache() {
    if (!cachedPixels) return
    const cols = Math.max(1, Math.floor(toValue(cellCols)))
    const grid = alphaGridFromPixels(cachedPixels, TILE_PX, TILE_PX, cols, cellRows)
    rows.value = densityToBraille(grid)
    coveragePercent.value = Math.round(averageDensity(grid) * 1000) / 10
  }

  async function load(c: Coords) {
    status.value = 'loading'
    try {
      let frame = readIndexCache()
      if (!frame) {
        const res = await fetch(INDEX_ENDPOINT)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        frame = latestRadarFrame(await res.json())
        if (!frame) throw new Error('malformed radar index')
        writeIndexCache(frame)
      }

      const { x, y } = latLonToTile(c.lat, c.lon, ZOOM)
      const url = radarTileUrl(frame, ZOOM, x, y)
      const img = await loadImage(url)

      const canvas = document.createElement('canvas')
      canvas.width = TILE_PX
      canvas.height = TILE_PX
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas unsupported')

      ctx.drawImage(img, 0, 0, TILE_PX, TILE_PX)
      // Throws on a tainted canvas — not expected to happen given the CORS
      // header above, but still a non-event if it ever does.
      const { data } = ctx.getImageData(0, 0, TILE_PX, TILE_PX)

      cachedPixels = data
      frameAt.value = new Date(frame.time * 1000)
      renderFromCache()
      status.value = 'ready'
    }
    catch {
      cachedPixels = null
      rows.value = []
      coveragePercent.value = null
      frameAt.value = null
      status.value = 'error'
    }
  }

  onMounted(() => {
    watch(coords, load, { immediate: true })
    if (isRef(cellCols) || typeof cellCols === 'function') {
      watch(() => toValue(cellCols), renderFromCache)
    }
  })

  return { status, rows, coveragePercent, frameAt }
}
