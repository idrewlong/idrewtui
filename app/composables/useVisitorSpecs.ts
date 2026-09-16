import { onMounted, readonly, ref } from 'vue'

/**
 * A neofetch of the visitor's own machine.
 *
 * Everything here is a local read — nothing is transmitted. Values the browser
 * will not tell us render as an em-dash with `supported: false` rather than a
 * zero, because a fabricated spec is worse than an absent one.
 */
export interface SpecRow {
  key: string
  value: string
  supported: boolean
}

const UNKNOWN = 'unknown'

/** Best-effort UA parsing. Deliberately coarse: we show a label, not a fingerprint. */
export function parseUserAgent(ua: string): { os: string, browser: string } {
  if (!ua) return { os: UNKNOWN, browser: UNKNOWN }

  const os
    = /Android/.test(ua) ? 'Android'
      : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
        : /Mac OS X/.test(ua) ? 'macOS'
          : /Windows NT/.test(ua) ? 'Windows'
            : /Linux/.test(ua) ? 'Linux'
              : UNKNOWN

  // Order matters: Chrome's UA also contains "Safari".
  const match
    = /Firefox\/(\d+)/.exec(ua) ? ['Firefox', /Firefox\/(\d+)/.exec(ua)![1]!]
      : /Edg\/(\d+)/.exec(ua) ? ['Edge', /Edg\/(\d+)/.exec(ua)![1]!]
        : /Chrome\/(\d+)/.exec(ua) ? ['Chrome', /Chrome\/(\d+)/.exec(ua)![1]!]
          : /Version\/(\d+).*Safari/.exec(ua) ? ['Safari', /Version\/(\d+).*Safari/.exec(ua)![1]!]
            : null

  return { os, browser: match ? `${match[0]} ${match[1]}` : UNKNOWN }
}

export function formatScreen(w: number, h: number, dpr: number): string {
  const ratio = Math.round(dpr * 10) / 10
  return ratio === 1 ? `${w}x${h}` : `${w}x${h} @${ratio}x`
}

/** GPU string via WebGL. Returns null when the extension is unavailable or blocked. */
function readGpu(): string | null {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) return null

    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ext) return null

    const raw = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string
    // Chrome wraps the real name: "ANGLE (Apple, Apple M3, OpenGL 4.1)".
    return /ANGLE \(([^,]+), ([^,]+)/.exec(raw)?.[2]?.trim() ?? raw
  }
  catch {
    return null
  }
}

function row(key: string, value: string | number | null | undefined): SpecRow {
  const ok = value !== null && value !== undefined && value !== ''
  return { key, value: ok ? String(value) : '—', supported: ok }
}

/**
 * The seeded skeleton below must have exactly as many rows as the hydrated
 * result pushed in `onMounted` — otherwise the panel grows on hydration and
 * the fixed-height/CLS contract (`TuiPanel`'s `rows` prop) breaks. It renders
 * server-side and pre-hydration, so every row starts as `null` (an em-dash),
 * never a fabricated value.
 */
export function useVisitorSpecs() {
  const specs = ref<SpecRow[]>([
    row('OS', null), row('BROWSER', null), row('CPU', null),
    row('MEM', null), row('GPU', null), row('SCR', null),
    row('LANG', null), row('TZ', null),
  ])

  onMounted(() => {
    const nav = navigator as Navigator & { deviceMemory?: number }
    const { os, browser } = parseUserAgent(navigator.userAgent)

    specs.value = [
      row('OS', os === UNKNOWN ? null : os),
      row('BROWSER', browser === UNKNOWN ? null : browser),
      row('CPU', nav.hardwareConcurrency ? `${nav.hardwareConcurrency} cores` : null),
      row('MEM', nav.deviceMemory ? `${nav.deviceMemory} GB` : null),
      row('GPU', readGpu()),
      row('SCR', formatScreen(screen.width, screen.height, devicePixelRatio)),
      row('LANG', navigator.language),
      row('TZ', Intl.DateTimeFormat().resolvedOptions().timeZone),
    ]
  })

  return { specs: readonly(specs) }
}
