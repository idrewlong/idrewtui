/**
 * Pure transformations for the weather panel's radar. Everything that
 * touches the network, an `Image`, or a `<canvas>` lives in
 * `~/composables/useRadar`; this file only does math on plain data, so it
 * is unit-testable without a DOM.
 */

export interface RadarFrame {
  /** Tile server origin, e.g. `https://tilecache.rainviewer.com`. */
  host: string
  /** Frame path, e.g. `/v2/radar/1700000600`. */
  path: string
  /** Unix seconds this frame represents. */
  time: number
}

/**
 * Parses RainViewer's `weather-maps.json` and returns the most recent
 * ("past") frame, or `null` when the payload is missing, malformed, or has
 * no frames — same contract as `toForecast` in `useWeather`: a bad shape
 * must never let a fabricated or NaN-bearing value reach the DOM, it must
 * fail closed instead.
 */
export function latestRadarFrame(payload: unknown): RadarFrame | null {
  if (!payload || typeof payload !== 'object') return null

  const p = payload as { host?: unknown, radar?: { past?: unknown } }
  if (typeof p.host !== 'string' || p.host.length === 0) return null

  const past = p.radar?.past
  if (!Array.isArray(past) || past.length === 0) return null

  const last = past[past.length - 1] as unknown
  if (!last || typeof last !== 'object') return null

  const frame = last as { time?: unknown, path?: unknown }
  if (typeof frame.time !== 'number' || !Number.isFinite(frame.time)) return null
  if (typeof frame.path !== 'string' || frame.path.length === 0) return null

  return { host: p.host, path: frame.path, time: frame.time }
}

/** Builds the documented RainViewer tile URL for one frame and tile coordinate. */
export function radarTileUrl(frame: Pick<RadarFrame, 'host' | 'path'>, z: number, x: number, y: number): string {
  return `${frame.host}${frame.path}/256/${z}/${x}/${y}/2/1_1.png`
}

/**
 * Standard slippy-tile maths (the same formula OpenStreetMap and every
 * other XYZ tile provider uses) — converts a lat/lon to the z/x/y tile that
 * contains it. Coordinates are clamped to valid tile indices so a
 * near-pole or near-antimeridian reading never asks for a tile outside the
 * grid.
 */
export function latLonToTile(lat: number, lon: number, z: number): { x: number, y: number } {
  const n = 2 ** z
  const x = Math.floor(((lon + 180) / 360) * n)
  const latR = lat * Math.PI / 180
  const y = Math.floor(((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n)

  return {
    x: Math.min(n - 1, Math.max(0, x)),
    y: Math.min(n - 1, Math.max(0, y)),
  }
}

const DEFAULT_ALPHA_THRESHOLD = 10

/**
 * Downsamples an RGBA pixel buffer (as from `canvas.getImageData(...).data`)
 * into a `cellRows` x `cellCols` density grid. Each cell holds the fraction
 * (0-1) of its source pixels whose alpha exceeds `alphaThreshold` — i.e.
 * counts as a genuine radar return rather than transparent background.
 *
 * Deliberately takes a plain pixel buffer rather than an `ImageData`, so it
 * has no DOM dependency and can be unit-tested with a synthetic array.
 */
export function alphaGridFromPixels(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
  cellCols: number,
  cellRows: number,
  alphaThreshold = DEFAULT_ALPHA_THRESHOLD,
): number[][] {
  const hits: number[][] = Array.from({ length: cellRows }, () => Array(cellCols).fill(0))
  const totals: number[][] = Array.from({ length: cellRows }, () => Array(cellCols).fill(0))

  for (let py = 0; py < height; py++) {
    const cellRow = Math.min(cellRows - 1, Math.floor((py / height) * cellRows))
    for (let px = 0; px < width; px++) {
      const cellCol = Math.min(cellCols - 1, Math.floor((px / width) * cellCols))
      const alpha = pixels[(py * width + px) * 4 + 3] ?? 0
      totals[cellRow]![cellCol]!++
      if (alpha > alphaThreshold) hits[cellRow]![cellCol]!++
    }
  }

  return hits.map((row, r) => row.map((count, c) => count / (totals[r]![c] || 1)))
}

/**
 * Fixed dot-lighting order for one braille cell (2 cols x 4 rows), chosen to
 * fill visually top-to-bottom rather than any particular corner: dots 1,4
 * (top row), 2,5, 3,6, then 7,8 (bottom row). Braille dot numbering and bit
 * values match `DOT` in `~/utils/graph`.
 */
const DOT_PRIORITY = [0x01, 0x08, 0x02, 0x10, 0x04, 0x20, 0x40, 0x80] as const

/**
 * Pure transform: a density grid (0-1 per braille CELL, not per dot) to
 * braille rows. A cell's density picks how many of its 8 dots are lit, in
 * the fixed order above, so a heavier local return reads visibly denser —
 * this is the "map local density to dots" step called for in the spec.
 *
 * This is deliberately not `brailleChart` from `~/utils/graph`: that
 * function plots a 1D numeric series as a curve. This is a 2D bitmap.
 */
export function densityToBraille(grid: number[][]): string[] {
  return grid.map(row => row.map((density) => {
    const clamped = Number.isFinite(density) ? Math.min(1, Math.max(0, density)) : 0
    const dots = Math.round(clamped * DOT_PRIORITY.length)
    let mask = 0
    for (let i = 0; i < dots; i++) mask |= DOT_PRIORITY[i]!
    return String.fromCharCode(0x2800 + mask)
  }).join(''))
}

/**
 * Overall coverage fraction (0-1) across the whole grid — the "how much
 * precipitation is in view" figure for the hidden summary. `0` for an empty
 * grid rather than `NaN`, matching the rest of this project's rule against
 * ever letting a non-finite number reach the DOM.
 */
export function averageDensity(grid: number[][]): number {
  const flat = grid.flat()
  if (flat.length === 0) return 0
  return flat.reduce((sum, v) => sum + v, 0) / flat.length
}
