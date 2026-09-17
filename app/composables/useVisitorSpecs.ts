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

/**
 * Render helper for `deviceMemory`. The API is specified to round the
 * machine's actual RAM DOWN to a power of two and then CLAMP it at 8 — a
 * machine with 8, 16, or 128 GB all report `8`. So `8` never means "exactly
 * 8 GB", it means "8 GB or more", and printing a bare "8 GB" would claim a
 * precision the API deliberately refuses to give. Values below the clamp
 * are the API's honest (if power-of-two-rounded) best guess and render as-is.
 */
export function formatMemory(gb: number | null | undefined): string {
  if (gb === null || gb === undefined) return '—'
  return gb >= 8 ? '8 GB+' : `${gb} GB`
}

/**
 * Coarse plausibility filter for a WebGL renderer string — NOT an allowlist
 * of supported hardware. Privacy-hardened browsers (Brave, and Firefox with
 * `privacy.resistFingerprinting`) mask `WEBGL_debug_renderer_info` and hand
 * back a placeholder such as the browser's own name ("Brave"), which our
 * ANGLE-unwrap would otherwise print verbatim as if it were a GPU. A real
 * renderer string — masked or not, wrapped in ANGLE's parens or bare —
 * almost always contains one of these vendor/family/backend tokens; a
 * placeholder string won't. Deliberately not browser-sniffing: this never
 * checks for "Brave" or any other browser name, only for GPU-shaped text.
 */
const GPU_SIGNAL = /apple|nvidia|geforce|rtx|gtx|quadro|amd|radeon|intel|iris|uhd|hd graphics|adreno|mali|powervr|swiftshader|llvmpipe|vulkan|opengl|angle|metal|direct3d|m1|m2|m3|m4/i

/**
 * Pure: unwraps Chrome's ANGLE wrapper ("ANGLE (Apple, Apple M3, OpenGL 4.1)"
 * -> "Apple M3") and applies the plausibility filter above. Exported so the
 * unit tests can cover the masked-placeholder case without driving a real
 * WebGL context.
 */
export function sanitizeGpuString(raw: string | null | undefined): string | null {
  if (!raw) return null
  const extracted = /ANGLE \(([^,]+), ([^,]+)/.exec(raw)?.[2]?.trim() ?? raw
  return GPU_SIGNAL.test(extracted) ? extracted : null
}

/** GPU string via WebGL. Returns null when the extension is unavailable, blocked, or masked. */
function readGpu(): string | null {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) return null

    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ext) return null

    const raw = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string
    return sanitizeGpuString(raw)
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
    const memText = formatMemory(nav.deviceMemory)

    specs.value = [
      row('OS', os === UNKNOWN ? null : os),
      row('BROWSER', browser === UNKNOWN ? null : browser),
      row('CPU', nav.hardwareConcurrency ? `${nav.hardwareConcurrency} cores` : null),
      { key: 'MEM', value: memText, supported: memText !== '—' },
      row('GPU', readGpu()),
      row('SCR', formatScreen(screen.width, screen.height, devicePixelRatio)),
      row('LANG', navigator.language),
      row('TZ', Intl.DateTimeFormat().resolvedOptions().timeZone),
    ]
  })

  return { specs: readonly(specs) }
}
