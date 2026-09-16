/**
 * Text-graph rendering. Every graph on the site is drawn with characters rather
 * than SVG: it keeps the terminal fiction honest, adds no dependency, and the
 * output is trivially testable.
 *
 * These are pure functions — no DOM, no Vue, no reactivity.
 */

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const

/** Braille dot bit for [column][row]. Cell is 2 columns x 4 rows. */
const DOT = [
  [0x01, 0x02, 0x04, 0x40],
  [0x08, 0x10, 0x20, 0x80],
] as const

const BRAILLE_BLANK = '⠀' // U+2800, not a space: keeps cell width uniform.

function finite(values: number[]): number[] {
  return values.filter(v => Number.isFinite(v))
}

function range(values: number[], min?: number, max?: number) {
  const usable = finite(values)
  const lo = min ?? (usable.length ? Math.min(...usable) : 0)
  const hi = max ?? (usable.length ? Math.max(...usable) : 0)
  // A flat series has no span; treat it as the baseline rather than dividing by zero.
  return { lo, hi, span: hi - lo || 1, flat: hi === lo }
}

/** Compact single-row sparkline, e.g. `▁▂▃▅▇`. */
export function sparkline(values: number[], opts: { min?: number, max?: number } = {}): string {
  if (values.length === 0) return ''
  const { lo, span, flat } = range(values, opts.min, opts.max)

  return values.map((v) => {
    if (!Number.isFinite(v) || flat) return BLOCKS[0]
    const t = (v - lo) / span
    const i = Math.floor(Math.min(1, Math.max(0, t)) * (BLOCKS.length - 1))
    return BLOCKS[i]
  }).join('')
}

/** Proportional bar, e.g. `████░░░░`. */
export function barMeter(fraction: number, width: number): string {
  const f = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0
  const filled = Math.round(f * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

/**
 * Multi-row braille curve. Each character cell is 2 columns wide and 4 rows
 * tall, so a chart `width` cells wide plots 2*width samples at 4*height
 * vertical resolution.
 */
export function brailleChart(
  values: number[],
  opts: { width: number, height?: number, min?: number, max?: number },
): string[] {
  const height = opts.height ?? 3
  const width = opts.width

  if (values.length === 0) {
    return Array.from({ length: height }, () => BRAILLE_BLANK.repeat(width))
  }

  const cols = width * 2
  const rows = height * 4
  const { lo, span, flat } = range(values, opts.min, opts.max)

  // Resample the series to exactly one sample per dot column.
  const samples: number[] = []
  for (let c = 0; c < cols; c++) {
    const idx = values.length === 1 ? 0 : Math.round((c / (cols - 1)) * (values.length - 1))
    samples.push(values[Math.min(idx, values.length - 1)]!)
  }

  // masks[cellRow][cellCol] accumulates braille dot bits.
  const masks: number[][] = Array.from({ length: height }, () => Array(width).fill(0))

  samples.forEach((v, c) => {
    if (!Number.isFinite(v)) return
    const t = flat ? 0 : (v - lo) / span
    const clamped = Math.min(1, Math.max(0, t))
    // Row 0 is the top of the chart, so invert.
    const dotRow = Math.min(rows - 1, Math.round((1 - clamped) * (rows - 1)))
    const cellRow = Math.floor(dotRow / 4)
    const cellCol = Math.floor(c / 2)
    masks[cellRow]![cellCol]! |= DOT[c % 2]![dotRow % 4]!
  })

  return masks.map(row => row.map(m => String.fromCharCode(0x2800 + m)).join(''))
}

/** Plain-language summary of a series, for the visually-hidden text beside a graph. */
export function describeSeries(values: number[], unit: string): string {
  const usable = finite(values)
  if (usable.length === 0) return 'no data'

  const now = usable[usable.length - 1]!
  if (usable.length === 1) return `${now}${unit}`

  return `${Math.min(...usable)}${unit} to ${Math.max(...usable)}${unit}, now ${now}${unit}`
}
