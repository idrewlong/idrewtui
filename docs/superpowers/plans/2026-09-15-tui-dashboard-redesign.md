# TUI Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild idrewlong.com as a btop-style live dashboard — visitor machine specs, live meters, local weather and session telemetry in persistent panels around a swappable content region.

**Architecture:** Extend the existing Nuxt 4 static site rather than restart. One composable owns one data source and exposes a `supported` flag; one `Panel` component renders any panel; all graphs are text (braille, block sparklines, bar meters) with a visually-hidden summary for assistive tech. Colour themes are generated from vendored Omarchy `colors.toml` files by a build script that auto-tunes every token to WCAG AA.

**Tech Stack:** Nuxt 4.5, Vue 3.5, TypeScript strict, Tailwind v4 (tokens only), Vitest, Playwright + @axe-core/playwright, Lighthouse CI, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-15-tui-dashboard-redesign-design.md`

## Global Constraints

- **Never invent facts or data.** No simulated CPU load, no placeholder metrics. A value the browser cannot supply renders as `—` with a `supported: false` flag. (Spec §4.1)
- **Every panel has a fixed height at each breakpoint.** This is what holds CLS at zero when values populate on hydration. (Spec §5)
- **Contrast:** every token pair ≥4.5:1 against both `--bg` and `--surface`, in every shipped theme, verified by test — not by eye. (Spec §7)
- **Graph glyphs are `aria-hidden`** and always followed by a visually-hidden text summary. (Spec §7)
- **Ticking meters are never live regions** — `aria-live="off"`. (Spec §7)
- **All motion stops under `prefers-reduced-motion`**; all meters pause on `visibilitychange`. (Spec §4.4)
- **Interactive targets ≥24×24px** (WCAG 2.2). (Spec §7)
- **First-view JS ≤120 KB gzipped**, enforced by test. (Spec §2)
- **Lighthouse:** Performance ≥95, Accessibility 100, Best Practices 100, SEO 100, CLS exactly 0.
- **No new runtime dependencies** without justification. Prefer the platform. (CLAUDE.md)
- Gate before any task is done: `pnpm lint && pnpm typecheck && pnpm test`. UI tasks also run `pnpm test:e2e`.
- Commits are conventional (`feat:`, `fix:`, `chore:`, `docs:`) and end with the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer.

## File Structure

**Created**

| Path | Responsibility |
|---|---|
| `app/utils/graph.ts` | Pure text-graph rendering: sparkline, braille chart, bar meter, plus text summaries. No DOM. |
| `app/utils/sun.ts` | Pure sunrise/sunset/moon-phase math. No network. |
| `app/utils/weather-codes.ts` | WMO weather code → human label. |
| `scripts/generate-themes.mjs` | Reads vendored Omarchy TOMLs, maps + AA-tunes, writes `themes.css`. |
| `vendor/omarchy-themes/*.toml` | Vendored Omarchy palettes (MIT, attributed) so builds are offline-reproducible. |
| `app/assets/css/themes.css` | **Generated.** All theme token blocks. Never hand-edited. |
| `app/components/tui/Panel.vue` | The panel frame primitive: title inset in border, fixed height. |
| `app/components/tui/Sparkline.vue` | Block sparkline + hidden summary. |
| `app/components/tui/BrailleChart.vue` | Braille curve + axis labels + hidden summary. |
| `app/components/tui/BarMeter.vue` | `█░` bar + hidden summary. |
| `app/components/tui/ThemePicker.vue` | Theme list panel; click or `t` to cycle. |
| `app/components/panels/WhoamiPanel.vue` | Andrew's recruiter facts. Prerendered. |
| `app/components/panels/VisitorPanel.vue` | Visitor machine specs. |
| `app/components/panels/MetersPanel.vue` | FPS, heap, network, latency, battery. |
| `app/components/panels/WeatherPanel.vue` | Weather, sun, moon. |
| `app/components/panels/SessionPanel.vue` | Route, uptime, event log. |
| `app/composables/useVisitorSpecs.ts` | Static device/browser reads. |
| `app/composables/useFrameRate.ts` | rAF frame-rate sampling. |
| `app/composables/useMemoryMeter.ts` | `performance.memory` polling. |
| `app/composables/useNetworkInfo.ts` | `navigator.connection` + latency probe. |
| `app/composables/useBattery.ts` | Battery level + charging. |
| `app/composables/useGeolocation.ts` | Geolocation with silent fallback. |
| `app/composables/useWeather.ts` | Open-Meteo fetch + localStorage cache. |
| `app/composables/useSession.ts` | Route history, uptime, event log. |
| `app/composables/useClock.ts` | Ticking clock. |

**Modified**

| Path | Change |
|---|---|
| `app/assets/css/tokens.css` | Drop the two hardcoded palettes; import generated `themes.css`. |
| `app/assets/css/base.css` | Generalise `.frame` into the panel/grid primitives. |
| `app/composables/useTheme.ts` | One-of-N themes instead of dark/light toggle. |
| `app/composables/useKeybindings.ts` | `t` cycles themes; no other shortcut changes. |
| `app/layouts/default.vue` | Dashboard grid replaces the single frame. |
| `app/components/tui/TabBar.vue` | Moves into the content region header. |
| `app/components/tui/StatusLine.vue` | Loses the theme toggle (ThemePicker owns it). |
| `package.json` | `generate-themes` script wired into `postinstall` + `generate`. |
| `docs/PROJECT.md` | §2 amendments table applied. |
| `README.md` | Known-gaps and results refreshed. |

**Deleted:** `app/components/views/Fastfetch.vue` — its content is now `WhoamiPanel` + `VisitorPanel`.

---

### Task 1: Text-graph utilities

Pure functions, no DOM, no Vue. Everything else renders through these.

**Files:**
- Create: `app/utils/graph.ts`
- Test: `tests/unit/graph.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `sparkline(values: number[], opts?: { min?: number, max?: number }): string`
  - `brailleChart(values: number[], opts: { width: number, height?: number, min?: number, max?: number }): string[]`
  - `barMeter(fraction: number, width: number): string`
  - `describeSeries(values: number[], unit: string): string`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/graph.spec.ts
import { describe, expect, it } from 'vitest'
import { barMeter, brailleChart, describeSeries, sparkline } from '../../app/utils/graph'

describe('sparkline', () => {
  it('maps a ramp across the full block range', () => {
    expect(sparkline([0, 1, 2, 3, 4, 5, 6, 7])).toBe('▁▂▃▄▅▆▇█')
  })

  it('renders a flat series on the baseline rather than dividing by zero', () => {
    expect(sparkline([5, 5, 5])).toBe('▁▁▁')
  })

  it('honours an explicit range so meters do not rescale every tick', () => {
    expect(sparkline([0, 30, 60], { min: 0, max: 60 })).toBe('▁▄█')
  })

  it('ignores non-finite values instead of emitting NaN glyphs', () => {
    expect(sparkline([0, Number.NaN, 7])).toBe('▁▁█')
  })

  it('returns an empty string for an empty series', () => {
    expect(sparkline([])).toBe('')
  })
})

describe('barMeter', () => {
  it('fills proportionally', () => {
    expect(barMeter(0.5, 8)).toBe('████░░░░')
    expect(barMeter(0, 4)).toBe('░░░░')
    expect(barMeter(1, 4)).toBe('████')
  })

  it('clamps out-of-range fractions', () => {
    expect(barMeter(-3, 4)).toBe('░░░░')
    expect(barMeter(9, 4)).toBe('████')
  })
})

describe('brailleChart', () => {
  it('returns the requested number of rows', () => {
    const rows = brailleChart([0, 1, 2, 3, 4, 5, 6, 7], { width: 4, height: 2 })
    expect(rows).toHaveLength(2)
  })

  it('emits only braille characters', () => {
    const rows = brailleChart([0, 5, 2, 8, 3], { width: 6, height: 3 })
    for (const row of rows.join('')) {
      expect(row.codePointAt(0)).toBeGreaterThanOrEqual(0x2800)
      expect(row.codePointAt(0)).toBeLessThanOrEqual(0x28FF)
    }
  })

  it('pads every row to the requested width so the panel cannot jitter', () => {
    const rows = brailleChart([1, 2], { width: 10, height: 2 })
    for (const row of rows) expect([...row]).toHaveLength(10)
  })

  it('returns blank rows for an empty series', () => {
    const rows = brailleChart([], { width: 3, height: 2 })
    expect(rows).toEqual(['⠀⠀⠀', '⠀⠀⠀'])
  })
})

describe('describeSeries', () => {
  it('summarises a series for screen readers', () => {
    expect(describeSeries([10, 20, 30], '°F')).toBe('10°F to 30°F, now 30°F')
  })

  it('handles a single reading', () => {
    expect(describeSeries([42], 'fps')).toBe('42fps')
  })

  it('says so when there is no data', () => {
    expect(describeSeries([], '°F')).toBe('no data')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/unit/graph.spec.ts`
Expected: FAIL — cannot resolve `../../app/utils/graph`.

- [ ] **Step 3: Implement the utilities**

```ts
// app/utils/graph.ts
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
    const i = Math.round(Math.min(1, Math.max(0, t)) * (BLOCKS.length - 1))
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run tests/unit/graph.spec.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Run the full gate**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/utils/graph.ts tests/unit/graph.spec.ts
git commit -m "feat: add text-graph utilities (sparkline, braille, bar)

Pure functions rendering series as characters rather than SVG, each with a
plain-language summary for assistive tech.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Theme generator and contrast guard

Turns vendored Omarchy palettes into AA-compliant CSS. The contrast test is the guard that keeps every future theme honest.

**Files:**
- Create: `scripts/generate-themes.mjs`, `vendor/omarchy-themes/README.md`, `vendor/omarchy-themes/<theme>.toml` (10 files)
- Create: `tests/unit/themes.spec.ts`
- Generated: `app/assets/css/themes.css`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `app/assets/css/themes.css` defining `:root[data-theme="<name>"]` blocks for all ten themes, each setting `--bg --surface --line --fg --muted --accent --link --danger --theme-name --theme-mode`.
  - `scripts/generate-themes.mjs` exporting `generateThemes(): Array<{ name, mode, tokens }>` for the test to import.

- [ ] **Step 1: Vendor the ten Omarchy palettes**

Ten themes, per spec §6. Copy each `colors.toml` from `https://github.com/basecamp/omarchy/tree/master/themes/<name>/colors.toml`:

```bash
mkdir -p vendor/omarchy-themes
git clone --depth 1 https://github.com/basecamp/omarchy.git /tmp/omarchy
for t in tokyo-night kanagawa catppuccin gruvbox everforest osaka-jade matte-black ristretto rose-pine catppuccin-latte; do
  cp "/tmp/omarchy/themes/$t/colors.toml" "vendor/omarchy-themes/$t.toml"
done
cp /tmp/omarchy/LICENSE vendor/omarchy-themes/LICENSE
rm -rf /tmp/omarchy
ls vendor/omarchy-themes
```

Then write the attribution file:

```markdown
<!-- vendor/omarchy-themes/README.md -->
# Vendored Omarchy themes

Palettes from [Omarchy](https://github.com/basecamp/omarchy), MIT licensed,
© David Heinemeier Hansson. `LICENSE` is the upstream copy.

Vendored rather than fetched so builds are reproducible offline and a palette
never changes under us without a visible diff.

`scripts/generate-themes.mjs` maps these onto our semantic tokens and tunes any
token that fails WCAG AA. See the spec §6 for the mapping. To resync, re-copy
the `colors.toml` files and run `pnpm generate-themes`.
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/unit/themes.spec.ts
import { describe, expect, it } from 'vitest'
import { generateThemes } from '../../scripts/generate-themes.mjs'

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const channels = [0, 2, 4].map(i => Number.parseInt(h.slice(i, i + 2), 16) / 255)
  const linear = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const themes = generateThemes()
const TEXT_TOKENS = ['fg', 'muted', 'accent', 'link', 'danger'] as const

describe('generated themes', () => {
  it('generates all ten themes named in the spec', () => {
    expect(themes.map(t => t.name).sort()).toEqual([
      'catppuccin', 'catppuccin-latte', 'everforest', 'gruvbox', 'kanagawa',
      'matte-black', 'osaka-jade', 'ristretto', 'rose-pine', 'tokyo-night',
    ])
  })

  it('defaults to tokyo-night being present and dark', () => {
    const tn = themes.find(t => t.name === 'tokyo-night')!
    expect(tn.mode).toBe('dark')
  })

  it('ships both a dark and a light option', () => {
    expect(themes.some(t => t.mode === 'dark')).toBe(true)
    expect(themes.some(t => t.mode === 'light')).toBe(true)
  })

  // The guard. Omarchy's palettes fail AA as-authored; the generator must fix them.
  it.each(themes.map(t => [t.name, t] as const))(
    '%s meets WCAG AA for every text token on both surfaces',
    (_name, theme) => {
      for (const token of TEXT_TOKENS) {
        expect(contrast(theme.tokens[token], theme.tokens.bg)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.tokens[token], theme.tokens.surface)).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  it.each(themes.map(t => [t.name, t] as const))(
    '%s keeps link visually distinct from accent',
    (_name, theme) => {
      expect(theme.tokens.link).not.toBe(theme.tokens.accent)
    },
  )

  it.each(themes.map(t => [t.name, t] as const))(
    '%s emits every token as a 6-digit hex colour',
    (_name, theme) => {
      for (const value of Object.values(theme.tokens)) {
        expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    },
  )
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/themes.spec.ts`
Expected: FAIL — cannot resolve `scripts/generate-themes.mjs`.

- [ ] **Step 4: Write the generator**

```js
// scripts/generate-themes.mjs
/**
 * Generates `app/assets/css/themes.css` from the vendored Omarchy palettes.
 *
 * Omarchy's themes are built for terminals, where a dim comment colour is
 * normal. On the web that fails WCAG AA — not one of the 22 upstream themes
 * passes when mapped naively. So every token is checked against both surfaces
 * and blended toward the foreground until it clears. Tokyo Night needs exactly
 * one token moved, so the themes stay recognisably themselves.
 *
 * Run via `pnpm generate-themes`. Never hand-edit the generated CSS.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VENDOR = join(ROOT, 'vendor/omarchy-themes')
const OUT = join(ROOT, 'app/assets/css/themes.css')

/** Order matters: it is the order `t` cycles through. */
export const THEME_ORDER = [
  'tokyo-night', 'kanagawa', 'catppuccin', 'gruvbox', 'everforest',
  'osaka-jade', 'matte-black', 'ristretto', 'rose-pine', 'catppuccin-latte',
]

const AA = 4.6 // Target slightly above 4.5 so rounding cannot land us under.

function parseToml(text) {
  const out = {}
  for (const line of text.split('\n')) {
    const m = /^\s*(\w+)\s*=\s*"([^"]*)"/.exec(line)
    if (m) out[m[1]] = m[2]
  }
  return out
}

const rgb = hex => [0, 2, 4].map(i => Number.parseInt(hex.replace('#', '').slice(i, i + 2), 16))
const toHex = ch => `#${ch.map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('').toUpperCase()}`

function luminance(hex) {
  const linear = rgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function hue(hex) {
  const [r, g, b] = rgb(hex).map(c => c / 255)
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const d = max - min
  if (d === 0) return 0
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return ((h * 60) + 360) % 360
}

function hueGap(a, b) {
  const d = Math.abs(hue(a) - hue(b)) % 360
  return Math.min(d, 360 - d)
}

/** Blend `color` toward `toward`, then toward pure white/black, until it clears AA. */
function tune(color, bases, toward) {
  if (bases.every(b => contrast(color, b) >= AA)) return color

  const from = rgb(color)
  for (const target of [rgb(toward), luminance(bases[0]) < 0.5 ? [255, 255, 255] : [0, 0, 0]]) {
    for (let i = 1; i <= 100; i++) {
      const t = i / 100
      const candidate = toHex(from.map((c, j) => c + (target[j] - c) * t))
      if (bases.every(b => contrast(candidate, b) >= AA)) return candidate
    }
  }
  return luminance(bases[0]) < 0.5 ? '#FFFFFF' : '#000000'
}

export function generateThemes() {
  const files = readdirSync(VENDOR).filter(f => f.endsWith('.toml'))
  const themes = []

  for (const name of THEME_ORDER) {
    const file = `${name}.toml`
    if (!files.includes(file)) throw new Error(`missing vendored theme: ${file}`)
    const c = parseToml(readFileSync(join(VENDOR, file), 'utf8'))

    const bg = c.background
    const surface = c.lighter_background || c.selection || bg
    const line = c.muted || surface
    const bases = [bg, surface]

    // Link must read as a different hue from the accent, or links vanish into headings.
    const candidates = ['cyan', 'bright_cyan', 'green', 'magenta', 'bright_magenta', 'blue', 'yellow']
      .map(k => c[k]).filter(Boolean)
    const link = candidates.find(x => hueGap(x, c.accent) > 40) || candidates[0] || c.accent

    themes.push({
      name,
      mode: c.mode === 'light' ? 'light' : 'dark',
      tokens: {
        bg: toHex(rgb(bg)),
        surface: toHex(rgb(surface)),
        line: toHex(rgb(line)),
        fg: tune(c.foreground, bases, c.foreground),
        muted: tune(c.dark_foreground, bases, c.foreground),
        accent: tune(c.accent, bases, c.foreground),
        link: tune(link, bases, c.foreground),
        danger: tune(c.red, bases, c.foreground),
      },
    })
  }
  return themes
}

function toCss(themes) {
  const block = t => `:root[data-theme="${t.name}"] {
  color-scheme: ${t.mode};
${Object.entries(t.tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n')}
  --theme-name: "${t.name}";
  --theme-mode: "${t.mode}";
}`

  const dark = themes.find(t => t.mode === 'dark')
  const light = themes.find(t => t.mode === 'light')
  const defaults = t => Object.entries(t.tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n')

  return `/**
 * GENERATED by scripts/generate-themes.mjs — do not edit.
 * Palettes from Omarchy (MIT, (c) David Heinemeier Hansson), tuned to WCAG AA.
 * Regenerate with \`pnpm generate-themes\`.
 */

/* Default before any choice is stored, and the no-JS baseline. */
:root {
  color-scheme: ${dark.mode};
${defaults(dark)}
  --theme-name: "${dark.name}";
  --theme-mode: "${dark.mode}";
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
    color-scheme: light;
${defaults(light)}
    --theme-name: "${light.name}";
    --theme-mode: "light";
  }
}

${themes.map(block).join('\n\n')}
`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const themes = generateThemes()
  writeFileSync(OUT, toCss(themes))
  console.log(`[generate-themes] wrote ${themes.length} themes to ${OUT}`)
}
```

- [ ] **Step 5: Declare the script's types**

`tests/unit/themes.spec.ts` imports a `.mjs` file, which TypeScript cannot infer.

```ts
// scripts/generate-themes.d.ts
export interface GeneratedTheme {
  name: string
  mode: 'dark' | 'light'
  tokens: {
    bg: string
    surface: string
    line: string
    fg: string
    muted: string
    accent: string
    link: string
    danger: string
  }
}

export declare const THEME_ORDER: string[]
export declare function generateThemes(): GeneratedTheme[]
```

- [ ] **Step 6: Wire the script up and generate**

In `package.json` add to `scripts`:

```json
"generate-themes": "node scripts/generate-themes.mjs",
```

and make both `postinstall` and `generate` depend on it:

```json
"postinstall": "node scripts/generate-themes.mjs && nuxt prepare",
"generate": "node scripts/generate-themes.mjs && nuxt generate && node scripts/finalize-static.mjs",
```

Add the generated file to `.gitignore` under the nuxt section:

```
# generated by scripts/generate-themes.mjs
app/assets/css/themes.css
```

Run: `pnpm generate-themes`
Expected: `[generate-themes] wrote 10 themes to …/themes.css`

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/themes.spec.ts`
Expected: PASS. Every theme clears AA on all five text tokens against both surfaces.

- [ ] **Step 8: Commit**

```bash
git add scripts/generate-themes.mjs scripts/generate-themes.d.ts vendor/ \
  tests/unit/themes.spec.ts package.json .gitignore
git commit -m "feat: generate AA-tuned themes from vendored Omarchy palettes

None of Omarchy's palettes pass WCAG AA as authored -- terminal comment
colours are far too dim for the web. The generator blends failing tokens
toward the foreground until they clear, which moves Tokyo Night by exactly
one value. A test asserts every generated theme stays compliant.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Theme switching

Replaces the dark/light toggle with one-of-N selection. Site still looks like v2 afterwards, just repainted in Tokyo Night.

**Files:**
- Modify: `app/composables/useTheme.ts`, `app/assets/css/tokens.css`, `app/app.vue`, `app/components/tui/StatusLine.vue`
- Create: `app/components/tui/ThemePicker.vue`
- Modify: `tests/unit/theme.spec.ts`

**Interfaces:**
- Consumes: `themes.css` and `THEME_ORDER` from Task 2.
- Produces:
  - `THEME_NAMES: readonly string[]` — cycle order, `tokyo-night` first.
  - `DEFAULT_DARK = 'tokyo-night'`, `DEFAULT_LIGHT = 'catppuccin-latte'`
  - `parseStoredTheme(value: string | null): string | null`
  - `resolveTheme(stored: string | null, prefersLight: boolean): string`
  - `nextTheme(current: string): string`
  - `useTheme(): { theme: Readonly<Ref<string>>, set(name: string): void, cycle(): string, names: readonly string[] }`

- [ ] **Step 1: Rewrite the theme unit tests**

Replace the `theme resolution` describe block in `tests/unit/theme.spec.ts`. Leave the `wrapIndex` and date-formatting blocks untouched.

```ts
// tests/unit/theme.spec.ts — replace the 'theme resolution' describe block with:
import {
  DEFAULT_DARK, DEFAULT_LIGHT, THEME_NAMES,
  nextTheme, parseStoredTheme, resolveTheme,
} from '../../app/composables/useTheme'

describe('theme resolution', () => {
  it('lists tokyo-night first so it is the default and first in the cycle', () => {
    expect(THEME_NAMES[0]).toBe('tokyo-night')
    expect(DEFAULT_DARK).toBe('tokyo-night')
  })

  it('prefers a stored choice over the OS setting', () => {
    expect(resolveTheme('gruvbox', true)).toBe('gruvbox')
    expect(resolveTheme('kanagawa', false)).toBe('kanagawa')
  })

  it('follows the OS when nothing is stored', () => {
    expect(resolveTheme(null, true)).toBe(DEFAULT_LIGHT)
    expect(resolveTheme(null, false)).toBe(DEFAULT_DARK)
  })

  it('falls back when the stored value is not a theme we ship', () => {
    expect(resolveTheme('dracula', false)).toBe(DEFAULT_DARK)
    expect(parseStoredTheme('dracula')).toBeNull()
    expect(parseStoredTheme(null)).toBeNull()
    expect(parseStoredTheme('gruvbox')).toBe('gruvbox')
  })

  it('cycles through every theme and wraps', () => {
    const seen = new Set<string>()
    let current = THEME_NAMES[0]!
    for (let i = 0; i < THEME_NAMES.length; i++) {
      seen.add(current)
      current = nextTheme(current)
    }
    expect(seen.size).toBe(THEME_NAMES.length)
    expect(current).toBe(THEME_NAMES[0])
  })

  it('cycles from an unknown theme to the first rather than getting stuck', () => {
    expect(nextTheme('dracula')).toBe(THEME_NAMES[0])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/theme.spec.ts`
Expected: FAIL — `THEME_NAMES` is not exported.

- [ ] **Step 3: Rewrite the composable**

```ts
// app/composables/useTheme.ts
import { onMounted, readonly, ref } from 'vue'

/**
 * One-of-N theme selection. Themes are generated into `themes.css` from the
 * vendored Omarchy palettes; this module only decides which one is active.
 *
 * Keep THEME_NAMES in sync with THEME_ORDER in scripts/generate-themes.mjs.
 */
export const THEME_NAMES = [
  'tokyo-night', 'kanagawa', 'catppuccin', 'gruvbox', 'everforest',
  'osaka-jade', 'matte-black', 'ristretto', 'rose-pine', 'catppuccin-latte',
] as const

export type Theme = typeof THEME_NAMES[number]

export const DEFAULT_DARK: Theme = 'tokyo-night'
export const DEFAULT_LIGHT: Theme = 'catppuccin-latte'
export const THEME_STORAGE_KEY = 'idrewlong:theme'

/** A stored value is only trusted when it names a theme we actually ship. */
export function parseStoredTheme(value: string | null): Theme | null {
  return THEME_NAMES.includes(value as Theme) ? value as Theme : null
}

/** Stored choice wins; otherwise follow the OS. Mirrors the inline script in app.vue. */
export function resolveTheme(stored: string | null, prefersLight: boolean): Theme {
  return parseStoredTheme(stored) ?? (prefersLight ? DEFAULT_LIGHT : DEFAULT_DARK)
}

/** Next theme in cycle order; an unrecognised theme restarts the cycle. */
export function nextTheme(current: string): Theme {
  const i = THEME_NAMES.indexOf(current as Theme)
  return THEME_NAMES[(i + 1) % THEME_NAMES.length]!
}

export function useTheme() {
  const theme = ref<Theme>(DEFAULT_DARK)

  function set(next: Theme) {
    theme.value = next
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    }
    catch {
      // Private mode or blocked storage: the choice just won't persist.
    }
  }

  function cycle(): Theme {
    set(nextTheme(theme.value))
    return theme.value
  }

  onMounted(() => {
    // The pre-paint script in app.vue has already stamped data-theme.
    theme.value = parseStoredTheme(document.documentElement.dataset.theme ?? null)
      ?? resolveTheme(null, window.matchMedia('(prefers-color-scheme: light)').matches)
  })

  return { theme: readonly(theme), set, cycle, names: THEME_NAMES }
}
```

- [ ] **Step 4: Point tokens.css at the generated themes**

Replace the palette blocks in `app/assets/css/tokens.css`. Keep the type scale, font stack, layout variables and the `@theme inline` block exactly as they are — only the colour definitions move.

```css
/* app/assets/css/tokens.css — replace the :root palette, the
   :root[data-theme="light"] block and the prefers-color-scheme block with: */
@import "tailwindcss";
@import "./themes.css";

:root {
  /* Type scale (rem) */
  --text-status: 0.8125rem;
  --text-body: 0.9375rem;
  --text-prompt: 1rem;
  --text-name: 1.25rem;

  --font-mono: "Commit Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  /* Layout */
  --pane-width: 88ch;
  --measure: 80ch;
}

/* Colour tokens themselves live in the generated themes.css. */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-line: var(--line);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-link: var(--link);
  --color-danger: var(--danger);
  --font-mono: var(--font-mono);
}
```

- [ ] **Step 5: Update the pre-paint script**

In `app/app.vue`, replace the `themeScript` constant. It must stamp a theme name rather than `dark`/`light`, and keep setting `data-js` before first paint.

```ts
const themeScript = `
(function(){var d=document.documentElement;d.dataset.js='true';try{
var names=${JSON.stringify(THEME_NAMES)};
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
d.dataset.theme=names.indexOf(s)>-1?s:(matchMedia('(prefers-color-scheme: light)').matches?${JSON.stringify(DEFAULT_LIGHT)}:${JSON.stringify(DEFAULT_DARK)});
}catch(e){d.dataset.theme=${JSON.stringify(DEFAULT_DARK)}}})();
`.trim()
```

Update the import at the top of `app/app.vue`:

```ts
import { DEFAULT_DARK, DEFAULT_LIGHT, THEME_NAMES, THEME_STORAGE_KEY } from '~/composables/useTheme'
```

- [ ] **Step 6: Build the theme picker**

```vue
<!-- app/components/tui/ThemePicker.vue -->
<script setup lang="ts">
import { THEME_NAMES, type Theme } from '~/composables/useTheme'

/**
 * Theme list, styled as a panel body. `t` cycles; clicking picks directly.
 * A radiogroup rather than a listbox: these are mutually exclusive settings
 * applied immediately, not a value being selected for later submission.
 */
defineProps<{ current: Theme }>()
defineEmits<{ select: [Theme] }>()
</script>

<template>
  <ul class="themes" role="radiogroup" aria-label="Colour theme">
    <li v-for="name in THEME_NAMES" :key="name">
      <button
        type="button"
        class="theme"
        role="radio"
        :aria-checked="name === current"
        @click="$emit('select', name)"
      >
        <span class="theme__marker" aria-hidden="true">{{ name === current ? '▸' : ' ' }}</span>
        <span class="theme__name">{{ name }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.themes { display: grid; gap: 0.1rem; }

.theme {
  display: flex;
  align-items: center;
  gap: 1ch;
  width: 100%;
  min-height: 1.5rem;
  color: var(--muted);
  text-align: left;
}
.theme:hover { color: var(--fg); }

.theme[aria-checked="true"] {
  color: var(--accent);
  font-weight: 600;
}

.theme__marker { color: var(--accent); }
</style>
```

- [ ] **Step 7: Swap the status-line toggle for a cycle control**

In `app/components/tui/StatusLine.vue`: change the `theme` prop type from `Theme` (dark/light) to `string`, drop `aria-pressed` (it is no longer binary), and have the button cycle. Replace the theme button block with:

```vue
      <button
        type="button"
        class="status__btn js-only"
        @click="$emit('cycle-theme')"
      >
        <span aria-hidden="true">◑</span>
        <span class="visually-hidden">Next colour theme (current: {{ theme }})</span>
      </button>
```

and change the emit declaration to:

```ts
defineEmits<{ help: [], 'cycle-theme': [] }>()
```

In `app/layouts/default.vue`, update the handler and the template binding:

```ts
const { theme, cycle: cycleTheme } = useTheme()

function onThemeCycle() {
  const next = cycleTheme()
  flash(`theme → ${next}`)
}
```

```vue
      <TuiStatusLine
        :path="currentPath"
        :message="message"
        :theme="theme"
        @help="helpOpen = true"
        @cycle-theme="onThemeCycle"
      />
```

and point the `theme:toggle` keybinding at `onThemeCycle`.

- [ ] **Step 8: Update the e2e theme test**

In `tests/e2e/keyboard.spec.ts`, replace the `t toggles the theme and persists it` test:

```ts
  test('t cycles the theme and persists it', async ({ page }) => {
    await gotoHydrated(page, '/')
    const before = await page.locator('html').getAttribute('data-theme')
    expect(before).toBeTruthy()

    await page.keyboard.press('t')
    const after = await page.locator('html').getAttribute('data-theme')
    expect(after).not.toBe(before)

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', after!)
  })
```

- [ ] **Step 9: Run the full gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: all pass. The site now renders in Tokyo Night; `t` cycles ten themes.

- [ ] **Step 10: Commit**

```bash
git add app/composables/useTheme.ts app/assets/css/tokens.css app/app.vue \
  app/components/tui/ThemePicker.vue app/components/tui/StatusLine.vue \
  app/layouts/default.vue tests/unit/theme.spec.ts tests/e2e/keyboard.spec.ts
git commit -m "feat: switch between ten themes instead of dark/light

t cycles, choice persists, first visit follows prefers-color-scheme.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Panel primitive and dashboard grid

The structural change. Afterwards the layout is a dashboard shell with the existing content in the centre region and one real panel; later tasks fill the rest.

**Files:**
- Create: `app/components/tui/Panel.vue`, `app/components/panels/WhoamiPanel.vue`
- Modify: `app/assets/css/base.css`, `app/layouts/default.vue`, `app/components/tui/TabBar.vue`
- Delete: `app/components/views/Fastfetch.vue`
- Modify: `app/pages/index.vue`
- Create: `tests/e2e/dashboard.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `<TuiPanel title="whoami" :rows="4">` — `title: string`, `rows?: number` (fixed body height in text rows, default 4), optional `#actions` slot rendered at the panel's top-right.
  - CSS grid areas named `whoami`, `visitor`, `meters`, `content`, `wx`, `session`.

- [ ] **Step 1: Write the failing e2e test**

```ts
// tests/e2e/dashboard.spec.ts
import { expect, test } from '@playwright/test'

test.describe('dashboard shell', () => {
  test('renders the named panels around the content region', async ({ page }) => {
    await page.goto('/')
    for (const title of ['whoami', 'visitor', 'meters', 'wx', 'session']) {
      await expect(page.getByRole('region', { name: title })).toBeVisible()
    }
    await expect(page.locator('#main')).toBeVisible()
  })

  test('keeps the recruiter panel above the fold at 1366x768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/')

    const box = await page.getByRole('region', { name: 'whoami' }).boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y + box!.height).toBeLessThanOrEqual(768)
  })

  test('panel heights do not change when values populate', async ({ page }) => {
    await page.goto('/')
    const panel = page.getByRole('region', { name: 'visitor' })
    const before = (await panel.boundingBox())!.height
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')
    const after = (await panel.boundingBox())!.height
    expect(after).toBe(before)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec playwright test tests/e2e/dashboard.spec.ts --project=desktop`
Expected: FAIL — no region named `whoami`.

- [ ] **Step 3: Build the Panel primitive**

```vue
<!-- app/components/tui/Panel.vue -->
<script setup lang="ts">
/**
 * A dashboard panel: a bordered box with its title inset into the top border.
 *
 * `rows` fixes the body height in text rows. Panels must not resize when their
 * values arrive on hydration — that is the whole CLS budget.
 */
withDefaults(defineProps<{
  title: string
  /** Body height in text rows. */
  rows?: number
}>(), { rows: 4 })
</script>

<template>
  <section class="panel" :aria-label="title">
    <div class="panel__bar">
      <h2 class="panel__title">{{ title }}</h2>
      <span class="panel__gap" aria-hidden="true" />
      <span v-if="$slots.actions" class="panel__actions"><slot name="actions" /></span>
    </div>

    <div class="panel__body" :style="{ '--rows': rows }">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.panel {
  position: relative;
  /* Stacking context so the z-index:-1 border paints above the panel's own
     background but below the content. */
  isolation: isolate;
  background: var(--surface);
  min-width: 0;
}

.panel::before {
  content: "";
  position: absolute;
  inset: 0.75rem 0 0;
  border: 1px solid var(--line);
  z-index: -1;
}

.panel__bar {
  display: flex;
  align-items: center;
  height: 1.5rem;
  padding: 0 1.5ch;
  font-size: var(--text-status);
}

.panel__title,
.panel__actions {
  background: var(--surface);
  padding: 0 0.75ch;
  white-space: nowrap;
}

.panel__title {
  color: var(--accent);
  font-weight: 600;
  font-size: inherit;
}

.panel__gap { flex: 1; min-width: 1ch; }

.panel__body {
  /* Fixed height: rows x line-height, so populating values never reflows. */
  height: calc(var(--rows) * 1.6em);
  overflow: hidden;
  padding: 0.25rem 1.75ch 0.5rem;
  font-size: var(--text-status);
}
</style>
```

- [ ] **Step 4: Add the grid to base.css**

Append to `app/assets/css/base.css`:

```css
/* ── dashboard grid ─────────────────────────────────────────────────────── */

/**
 * Mobile first: one column, recruiter facts and content before the toys.
 * Every panel keeps a fixed height, so hydration populates values without
 * moving anything.
 */
.dash {
  display: grid;
  gap: 0.5rem;
  grid-template-areas:
    "whoami"
    "content"
    "visitor"
    "meters"
    "wx"
    "session";
}

.dash__whoami  { grid-area: whoami; }
.dash__visitor { grid-area: visitor; }
.dash__meters  { grid-area: meters; }
.dash__content { grid-area: content; }
.dash__wx      { grid-area: wx; }
.dash__session { grid-area: session; }

@media (min-width: 48rem) {
  .dash {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "whoami  visitor"
      "meters  session"
      "content content"
      "wx      wx";
  }
}

@media (min-width: 75rem) {
  .dash {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-areas:
      "whoami  visitor  meters"
      "content content  content"
      "wx      wx       session";
  }
}
```

- [ ] **Step 5: Build the whoami panel**

```vue
<!-- app/components/panels/WhoamiPanel.vue -->
<script setup lang="ts">
import { profile } from '~/data/profile'
import { certifications } from '~/data/skills'
import { track } from '~/utils/analytics'

/**
 * The recruiter panel. Prerendered from `app/data`, so it is correct with
 * JavaScript disabled and it is the first thing in the DOM.
 */
const certLine = certifications
  .map(c => (c.status === 'in-progress' ? `${c.name} (in progress)` : c.name))
  .join(' · ')
</script>

<template>
  <TuiPanel title="whoami" :rows="6">
    <dl class="kv">
      <dt>Role</dt><dd>{{ profile.role }}</dd>
      <dt>Org</dt><dd>{{ profile.employer }}</dd>
      <dt>Loc</dt><dd>{{ profile.location }}</dd>
      <dt>Stack</dt><dd>{{ profile.stack.join(' · ') }}</dd>
      <dt>Certs</dt><dd>{{ certLine }}</dd>
    </dl>

    <a
      class="resume"
      :href="profile.resumeUrl"
      target="_blank"
      rel="noopener"
      @click="track({ name: 'resume_download' })"
    >
      [ resume ↓ ]<span class="visually-hidden"> (PDF, opens in a new tab)</span>
    </a>
  </TuiPanel>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 6ch 1fr;
  gap: 0 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd {
  color: var(--fg);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resume {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  margin-top: 0.25rem;
  color: var(--accent);
  text-decoration: none;
}
.resume:hover { text-decoration: underline; }
</style>
```

- [ ] **Step 6: Restructure the layout**

Rewrite the template of `app/layouts/default.vue`. Keep the entire `<script setup>` as-is apart from the theme handler changed in Task 3.

```vue
<template>
  <div class="shell">
    <a class="skip" href="#main">Skip to content</a>

    <div class="shell__frame dash">
      <PanelsWhoamiPanel class="dash__whoami" />
      <PanelsVisitorPanel class="dash__visitor" />
      <PanelsMetersPanel class="dash__meters" />

      <div class="dash__content frame">
        <TuiTabBar />
        <TuiPane>
          <main id="main" tabindex="-1">
            <slot />
          </main>
        </TuiPane>
        <TuiStatusLine
          :path="currentPath"
          :message="message"
          :theme="theme"
          @help="helpOpen = true"
          @cycle-theme="onThemeCycle"
        />
      </div>

      <PanelsWeatherPanel class="dash__wx" />
      <PanelsSessionPanel class="dash__session" />
    </div>

    <TuiHelpOverlay v-model="helpOpen" />
  </div>
</template>
```

Widen the shell in the same file's `<style scoped>`: change `max-width: var(--pane-width)` to `max-width: 100rem` on `.shell__frame`.

Create the three panels not yet built as fixed-height stubs, so the layout is complete and testable now. Each is replaced with real data in Tasks 5–8.

```vue
<!-- app/components/panels/VisitorPanel.vue -->
<script setup lang="ts">
// Populated in Task 5.
</script>

<template>
  <TuiPanel title="visitor" :rows="6">
    <p class="pending">—</p>
  </TuiPanel>
</template>

<style scoped>
.pending { color: var(--muted); margin: 0; }
</style>
```

Create `app/components/panels/MetersPanel.vue` (title `meters`, rows 6), `app/components/panels/WeatherPanel.vue` (title `wx`, rows 8) and `app/components/panels/SessionPanel.vue` (title `session`, rows 6) with exactly the same body.

- [ ] **Step 7: Retire the Fastfetch view**

The fastfetch block is now `whoami` + `visitor`. Delete the component and drop it from the home page.

```bash
git rm app/components/views/Fastfetch.vue
```

In `app/pages/index.vue`, remove the `<ViewsFastfetch />` line and the now-unused `TuiRule id="about"` heading stays as-is. The page keeps the prompt, about and contact sections.

- [ ] **Step 8: Run the tests**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: PASS, including the three new `dashboard.spec.ts` tests.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: replace single frame with dashboard panel grid

Panel primitive with the title inset in its border and a fixed body height,
laid out as a responsive grid. Recruiter facts stay first in the DOM and
above the fold; remaining panels are stubs until their data lands.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Visitor specs panel

**Files:**
- Create: `app/composables/useVisitorSpecs.ts`
- Modify: `app/components/panels/VisitorPanel.vue`
- Create: `tests/unit/visitor-specs.spec.ts`

**Interfaces:**
- Consumes: `TuiPanel` from Task 4.
- Produces:
  - `parseUserAgent(ua: string): { os: string, browser: string }` — pure, exported for test.
  - `formatScreen(w: number, h: number, dpr: number): string`
  - `useVisitorSpecs(): { specs: Readonly<Ref<SpecRow[]>> }` where `SpecRow = { key: string, value: string, supported: boolean }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/visitor-specs.spec.ts
import { describe, expect, it } from 'vitest'
import { formatScreen, parseUserAgent } from '../../app/composables/useVisitorSpecs'

describe('parseUserAgent', () => {
  const cases: Array<[string, string, string, string]> = [
    ['macOS Safari', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', 'macOS', 'Safari 17'],
    ['Windows Chrome', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Windows', 'Chrome 124'],
    ['Linux Firefox', 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0', 'Linux', 'Firefox 125'],
    ['Android Chrome', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36', 'Android', 'Chrome 124'],
    ['iOS Safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', 'iOS', 'Safari 17'],
  ]

  it.each(cases)('parses %s', (_label, ua, os, browser) => {
    expect(parseUserAgent(ua)).toEqual({ os, browser })
  })

  it('degrades to unknown rather than guessing', () => {
    expect(parseUserAgent('some-crawler/1.0')).toEqual({ os: 'unknown', browser: 'unknown' })
    expect(parseUserAgent('')).toEqual({ os: 'unknown', browser: 'unknown' })
  })
})

describe('formatScreen', () => {
  it('includes the pixel ratio only when it is not 1', () => {
    expect(formatScreen(1512, 982, 2)).toBe('1512x982 @2x')
    expect(formatScreen(1920, 1080, 1)).toBe('1920x1080')
  })

  it('rounds fractional ratios', () => {
    expect(formatScreen(1280, 800, 1.5)).toBe('1280x800 @1.5x')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/visitor-specs.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the composable**

```ts
// app/composables/useVisitorSpecs.ts
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

export function useVisitorSpecs() {
  const specs = ref<SpecRow[]>([
    row('OS', null), row('BROWSER', null), row('CPU', null),
    row('MEM', null), row('GPU', null), row('SCR', null),
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/visitor-specs.spec.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Render the panel**

```vue
<!-- app/components/panels/VisitorPanel.vue -->
<script setup lang="ts">
import { useVisitorSpecs } from '~/composables/useVisitorSpecs'

/**
 * The visitor's own machine. Reads are local; nothing leaves the browser.
 * Rendered as a <dl> so the key/value relationship survives without the styling.
 */
const { specs } = useVisitorSpecs()
</script>

<template>
  <TuiPanel title="visitor" :rows="8">
    <dl class="kv">
      <template v-for="spec in specs" :key="spec.key">
        <dt>{{ spec.key }}</dt>
        <dd :class="{ 'kv__none': !spec.supported }">{{ spec.value }}</dd>
      </template>
    </dl>
  </TuiPanel>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 8ch 1fr;
  gap: 0 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd {
  color: var(--fg);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Unavailable, not zero. */
.kv__none { color: var(--muted); }
</style>
```

- [ ] **Step 6: Run the full gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: PASS. The `visitor` panel shows real values and its height is unchanged from the stub.

- [ ] **Step 7: Commit**

```bash
git add app/composables/useVisitorSpecs.ts app/components/panels/VisitorPanel.vue tests/unit/visitor-specs.spec.ts
git commit -m "feat: add visitor machine specs panel

OS, browser, cores, memory tier, GPU, screen, locale and timezone. All local
reads; unsupported values render as an em-dash rather than a fabricated zero.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Live meters panel

The panel that makes the page feel alive. Everything here is measured, not simulated.

**Files:**
- Create: `app/composables/useFrameRate.ts`, `app/composables/useMemoryMeter.ts`, `app/composables/useNetworkInfo.ts`, `app/composables/useBattery.ts`
- Create: `app/components/tui/Sparkline.vue`, `app/components/tui/BarMeter.vue`
- Modify: `app/components/panels/MetersPanel.vue`
- Create: `tests/unit/meters.spec.ts`

**Interfaces:**
- Consumes: `sparkline`, `barMeter`, `describeSeries` from Task 1; `TuiPanel` from Task 4.
- Note: uptime lives in the session panel (Task 7), not here — this task has no forward dependency.
- Produces:
  - `useFrameRate(samples?: number): { fps: Ref<number>, history: Ref<number[]>, supported: boolean }`
  - `useMemoryMeter(): { usedMb: Ref<number|null>, limitMb: Ref<number|null>, fraction: Ref<number>, supported: Ref<boolean> }`
  - `useNetworkInfo(): { effectiveType, downlink, rtt, online, supported }`
  - `useBattery(): { level: Ref<number|null>, charging: Ref<boolean|null>, supported: Ref<boolean> }`
  - `pushSample(history: number[], value: number, max: number): number[]` — pure, exported from `useFrameRate`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/meters.spec.ts
import { describe, expect, it } from 'vitest'
import { pushSample } from '../../app/composables/useFrameRate'

describe('pushSample', () => {
  it('appends while under the cap', () => {
    expect(pushSample([1, 2], 3, 5)).toEqual([1, 2, 3])
  })

  it('drops the oldest sample once full, so the window never grows', () => {
    expect(pushSample([1, 2, 3], 4, 3)).toEqual([2, 3, 4])
  })

  it('does not mutate the input array', () => {
    const history = [1, 2, 3]
    pushSample(history, 4, 3)
    expect(history).toEqual([1, 2, 3])
  })

  it('handles an empty history', () => {
    expect(pushSample([], 1, 3)).toEqual([1])
  })

  it('trims a history that is already over the cap', () => {
    expect(pushSample([1, 2, 3, 4, 5], 6, 3)).toEqual([4, 5, 6])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/meters.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the frame-rate composable**

```ts
// app/composables/useFrameRate.ts
import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Append `value`, keeping at most `max` samples. Pure; never mutates. */
export function pushSample(history: number[], value: number, max: number): number[] {
  return [...history, value].slice(-max)
}

/**
 * Real frame rate, measured by counting requestAnimationFrame callbacks over a
 * one-second window. This is one of the few genuinely live signals the browser
 * offers, which is why it earns a place in the meters panel.
 *
 * Pauses when the tab is hidden (a backgrounded tab is throttled to ~1fps and
 * would otherwise show a misleading crash) and freezes under reduced motion.
 */
export function useFrameRate(samples = 24) {
  const fps = ref(0)
  const history = ref<number[]>([])

  let raf = 0
  let frames = 0
  let windowStart = 0
  let running = false

  function tick(now: number) {
    if (!running) return
    frames++
    if (now - windowStart >= 1000) {
      fps.value = Math.round((frames * 1000) / (now - windowStart))
      history.value = pushSample(history.value, fps.value, samples)
      frames = 0
      windowStart = now
    }
    raf = requestAnimationFrame(tick)
  }

  function start() {
    if (running) return
    running = true
    frames = 0
    windowStart = performance.now()
    raf = requestAnimationFrame(tick)
  }

  function stop() {
    running = false
    cancelAnimationFrame(raf)
  }

  function onVisibility() {
    if (document.hidden) stop()
    else start()
  }

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.addEventListener('visibilitychange', onVisibility)
    start()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    stop()
  })

  return { fps, history, supported: true }
}
```

- [ ] **Step 4: Write the remaining meter composables**

```ts
// app/composables/useMemoryMeter.ts
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface ChromeMemory { usedJSHeapSize: number, jsHeapSizeLimit: number }

/**
 * JS heap usage. Chromium only — Safari and Firefox do not expose it, and
 * `supported` stays false there so the panel can say so honestly.
 */
export function useMemoryMeter(intervalMs = 2000) {
  const usedMb = ref<number | null>(null)
  const limitMb = ref<number | null>(null)
  const supported = ref(false)
  let timer: ReturnType<typeof setInterval> | undefined

  const fraction = computed(() =>
    usedMb.value !== null && limitMb.value ? usedMb.value / limitMb.value : 0)

  function read() {
    const mem = (performance as Performance & { memory?: ChromeMemory }).memory
    if (!mem) return
    usedMb.value = Math.round(mem.usedJSHeapSize / 1048576)
    limitMb.value = Math.round(mem.jsHeapSizeLimit / 1048576)
  }

  onMounted(() => {
    supported.value = 'memory' in performance
    if (!supported.value) return
    read()
    timer = setInterval(read, intervalMs)
  })

  onBeforeUnmount(() => clearInterval(timer))

  return { usedMb, limitMb, fraction, supported }
}
```

```ts
// app/composables/useNetworkInfo.ts
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface NetworkInformation extends EventTarget {
  effectiveType?: string
  downlink?: number
  rtt?: number
}

/**
 * Connection quality from the Network Information API (Chromium) plus online
 * state, which every browser reports. Values update live as the connection
 * changes.
 */
export function useNetworkInfo() {
  const effectiveType = ref<string | null>(null)
  const downlink = ref<number | null>(null)
  const rtt = ref<number | null>(null)
  const online = ref(true)
  const supported = ref(false)

  let connection: NetworkInformation | undefined

  function read() {
    if (!connection) return
    effectiveType.value = connection.effectiveType ?? null
    downlink.value = connection.downlink ?? null
    rtt.value = connection.rtt ?? null
  }

  function onOnline() { online.value = navigator.onLine }

  onMounted(() => {
    connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
    supported.value = Boolean(connection)
    online.value = navigator.onLine
    read()
    connection?.addEventListener('change', read)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOnline)
  })

  onBeforeUnmount(() => {
    connection?.removeEventListener('change', read)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOnline)
  })

  return { effectiveType, downlink, rtt, online, supported }
}
```

```ts
// app/composables/useBattery.ts
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface BatteryManager extends EventTarget {
  level: number
  charging: boolean
}

/** Battery level and charging state. Chromium only; `supported` gates the row. */
export function useBattery() {
  const level = ref<number | null>(null)
  const charging = ref<boolean | null>(null)
  const supported = ref(false)
  let battery: BatteryManager | undefined

  function read() {
    if (!battery) return
    level.value = battery.level
    charging.value = battery.charging
  }

  onMounted(async () => {
    const getBattery = (navigator as Navigator & {
      getBattery?: () => Promise<BatteryManager>
    }).getBattery
    if (!getBattery) return

    try {
      battery = await getBattery.call(navigator)
      supported.value = true
      read()
      battery.addEventListener('levelchange', read)
      battery.addEventListener('chargingchange', read)
    }
    catch {
      supported.value = false
    }
  })

  onBeforeUnmount(() => {
    battery?.removeEventListener('levelchange', read)
    battery?.removeEventListener('chargingchange', read)
  })

  return { level, charging, supported }
}
```

- [ ] **Step 5: Build the graph components**

```vue
<!-- app/components/tui/Sparkline.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { describeSeries, sparkline } from '~/utils/graph'

/**
 * Block sparkline. The glyphs are decorative; the hidden summary carries the
 * numbers, and the whole thing is deliberately not a live region — a meter
 * that announces itself every second is unusable with a screen reader.
 */
const props = withDefaults(defineProps<{
  values: readonly number[]
  unit?: string
  min?: number
  max?: number
  /** Pad to this many characters so the row cannot change width. */
  width?: number
}>(), { unit: '', width: 12 })

const glyphs = computed(() => {
  const line = sparkline([...props.values], { min: props.min, max: props.max })
  return line.padStart(props.width, ' ')
})

const summary = computed(() => describeSeries([...props.values], props.unit))
</script>

<template>
  <span class="spark" aria-live="off">
    <span class="spark__glyphs" aria-hidden="true">{{ glyphs }}</span>
    <span class="visually-hidden">{{ summary }}</span>
  </span>
</template>

<style scoped>
.spark__glyphs {
  color: var(--accent);
  white-space: pre;
  letter-spacing: 0;
}
</style>
```

```vue
<!-- app/components/tui/BarMeter.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { barMeter } from '~/utils/graph'

const props = withDefaults(defineProps<{
  fraction: number
  width?: number
  label: string
}>(), { width: 10 })

const glyphs = computed(() => barMeter(props.fraction, props.width))
const percent = computed(() => `${Math.round(Math.min(1, Math.max(0, props.fraction)) * 100)}%`)
</script>

<template>
  <span class="bar" aria-live="off">
    <span class="bar__glyphs" aria-hidden="true">{{ glyphs }}</span>
    <span class="visually-hidden">{{ label }} {{ percent }}</span>
  </span>
</template>

<style scoped>
.bar__glyphs { color: var(--accent); white-space: pre; }
</style>
```

- [ ] **Step 6: Render the meters panel**

```vue
<!-- app/components/panels/MetersPanel.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useBattery } from '~/composables/useBattery'
import { useFrameRate } from '~/composables/useFrameRate'
import { useMemoryMeter } from '~/composables/useMemoryMeter'
import { useNetworkInfo } from '~/composables/useNetworkInfo'

/**
 * Live browser-side telemetry. Deliberately not a fake CPU meter: the platform
 * does not expose process load, and inventing it would be dishonest. These are
 * all measured.
 */
const { fps, history } = useFrameRate()
const memory = useMemoryMeter()
const net = useNetworkInfo()
const battery = useBattery()

const netLine = computed(() => {
  if (!net.supported.value) return net.online.value ? 'online' : 'offline'
  const parts = [
    net.downlink.value !== null ? `↓${net.downlink.value}Mbps` : null,
    net.effectiveType.value,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'online'
})

const batteryLine = computed(() =>
  battery.supported.value && battery.level.value !== null
    ? `${Math.round(battery.level.value * 100)}%${battery.charging.value ? ' ⚡' : ''}`
    : '—')
</script>

<template>
  <TuiPanel title="meters" :rows="8">
    <dl class="kv">
      <dt>fps</dt>
      <dd><TuiSparkline :values="history" unit="fps" :min="0" :max="120" /> {{ fps || '—' }}</dd>

      <dt>heap</dt>
      <dd>
        <template v-if="memory.supported.value">
          <TuiBarMeter :fraction="memory.fraction.value" label="JS heap used" /> {{ memory.usedMb.value }}M
        </template>
        <span v-else class="kv__none">— unavailable</span>
      </dd>

      <dt>net</dt>
      <dd>{{ netLine }}</dd>

      <dt>rtt</dt>
      <dd>{{ net.rtt.value !== null ? `${net.rtt.value}ms` : '—' }}</dd>

      <dt>batt</dt>
      <dd :class="{ 'kv__none': batteryLine === '—' }">{{ batteryLine }}</dd>
    </dl>
  </TuiPanel>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 5ch 1fr;
  gap: 0 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd { color: var(--fg); margin: 0; white-space: nowrap; overflow: hidden; }
.kv__none { color: var(--muted); }
</style>
```

- [ ] **Step 7: Run the full gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: PASS. The fps sparkline visibly moves; heap says "unavailable" on Firefox/Safari.

- [ ] **Step 8: Commit**

```bash
git add app/composables/useFrameRate.ts app/composables/useMemoryMeter.ts \
  app/composables/useNetworkInfo.ts app/composables/useBattery.ts \
  app/components/tui/Sparkline.vue app/components/tui/BarMeter.vue \
  app/components/panels/MetersPanel.vue tests/unit/meters.spec.ts
git commit -m "feat: add live meters panel

Frame rate, JS heap, connection, latency, battery and uptime. All measured,
never simulated; unsupported signals say so. Meters pause on tab hide and
freeze under reduced motion, and are not live regions.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Session panel

Small and self-contained. Owns uptime, which the meters panel deliberately leaves to it.

**Files:**
- Create: `app/composables/useSession.ts`, `app/composables/useClock.ts`
- Modify: `app/components/panels/SessionPanel.vue`
- Create: `tests/unit/session.spec.ts`

**Interfaces:**
- Consumes: `TuiPanel` from Task 4.
- Produces:
  - `formatUptime(seconds: number): string` — pure, `HH:MM:SS`.
  - `useSession(): { uptime: Ref<string>, seconds: Ref<number>, route: Ref<string>, log: Ref<LogEntry[]>, visited: Ref<number> }` where `LogEntry = { method: 'GET', path: string, status: number, ms: number }`
  - `useClock(): { time: Ref<string> }` — `HH:MM:SS`, ticks every second.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/session.spec.ts
import { describe, expect, it } from 'vitest'
import { formatUptime } from '../../app/composables/useSession'

describe('formatUptime', () => {
  it('pads to HH:MM:SS', () => {
    expect(formatUptime(0)).toBe('00:00:00')
    expect(formatUptime(5)).toBe('00:00:05')
    expect(formatUptime(65)).toBe('00:01:05')
    expect(formatUptime(3661)).toBe('01:01:01')
  })

  it('keeps counting past a day rather than wrapping', () => {
    expect(formatUptime(90000)).toBe('25:00:00')
  })

  it('floors fractional seconds', () => {
    expect(formatUptime(9.9)).toBe('00:00:09')
  })

  it('treats negative input as zero', () => {
    expect(formatUptime(-5)).toBe('00:00:00')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/session.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the composables**

```ts
// app/composables/useSession.ts
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

export interface LogEntry {
  method: 'GET'
  path: string
  status: number
  ms: number
}

/** Seconds to HH:MM:SS. Hours are not capped, so a long session reads honestly. */
export function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

const MAX_LOG = 5

/**
 * Session telemetry: how long the visitor has been here, where they have been,
 * and a request log.
 *
 * The log is real — entries come from actual router navigations, and `ms` is
 * measured with performance.now(). The status is always 200 because a client
 * navigation that resolved is, by definition, a route we served.
 */
export function useSession() {
  const seconds = ref(0)
  const uptime = ref('00:00:00')
  const route = ref('/')
  const visited = ref(1)
  const log = ref<LogEntry[]>([])

  const router = useRouter()
  let timer: ReturnType<typeof setInterval> | undefined
  let navStart = 0
  let stopAfterEach: (() => void) | undefined
  let stopBeforeEach: (() => void) | undefined

  onMounted(() => {
    const start = performance.now()
    route.value = router.currentRoute.value.path

    timer = setInterval(() => {
      seconds.value = (performance.now() - start) / 1000
      uptime.value = formatUptime(seconds.value)
    }, 1000)

    stopBeforeEach = router.beforeEach(() => {
      navStart = performance.now()
      return true
    })

    stopAfterEach = router.afterEach((to) => {
      route.value = to.path
      visited.value++
      log.value = [
        ...log.value,
        { method: 'GET', path: to.path, status: 200, ms: Math.round(performance.now() - navStart) },
      ].slice(-MAX_LOG)
    })
  })

  onBeforeUnmount(() => {
    clearInterval(timer)
    stopBeforeEach?.()
    stopAfterEach?.()
  })

  return { uptime, seconds, route, log, visited }
}
```

```ts
// app/composables/useClock.ts
import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Wall clock, HH:MM:SS, in the visitor's own timezone. */
export function useClock() {
  const time = ref('--:--:--')
  let timer: ReturnType<typeof setInterval> | undefined

  function read() {
    time.value = new Date().toLocaleTimeString('en-GB', { hour12: false })
  }

  onMounted(() => {
    read()
    timer = setInterval(read, 1000)
  })

  onBeforeUnmount(() => clearInterval(timer))

  return { time }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/session.spec.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Render the panel**

```vue
<!-- app/components/panels/SessionPanel.vue -->
<script setup lang="ts">
import { useClock } from '~/composables/useClock'
import { useSession } from '~/composables/useSession'

const { uptime, route, visited, log } = useSession()
const { time } = useClock()
</script>

<template>
  <TuiPanel title="session" :rows="8">
    <dl class="kv">
      <dt>time</dt><dd>{{ time }}</dd>
      <dt>uptime</dt><dd>{{ uptime }}</dd>
      <dt>route</dt><dd>{{ route }}</dd>
      <dt>views</dt><dd>{{ visited }}</dd>
    </dl>

    <ul class="log" aria-label="Recent navigations">
      <li v-for="(entry, i) in log" :key="`${entry.path}-${i}`" class="log__row">
        <span class="log__method">{{ entry.method }}</span>
        <span class="log__path">{{ entry.path }}</span>
        <span class="log__status">{{ entry.status }}</span>
        <span class="log__ms">{{ entry.ms }}ms</span>
      </li>
    </ul>
  </TuiPanel>
</template>

<style scoped>
.kv {
  display: grid;
  grid-template-columns: 7ch 1fr;
  gap: 0 1.5ch;
  align-items: baseline;
}
.kv dt { color: var(--muted); }
.kv dd { color: var(--fg); margin: 0; }

.log { margin-top: 0.25rem; display: grid; gap: 0; }

.log__row {
  display: flex;
  gap: 1ch;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
}
.log__method { color: var(--link); }
.log__path { color: var(--fg); overflow: hidden; text-overflow: ellipsis; }
.log__status { color: var(--accent); }
</style>
```

- [ ] **Step 6: Run the full gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/composables/useSession.ts app/composables/useClock.ts \
  app/components/panels/SessionPanel.vue tests/unit/session.spec.ts
git commit -m "feat: add session panel with real navigation log

Clock, uptime, current route, view count and the last five navigations with
timings measured from the router.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Sun, moon and weather codes

Pure maths and lookups, so they are testable with no network at all. Task 9 wires them to the panel.

**Files:**
- Create: `app/utils/sun.ts`, `app/utils/weather-codes.ts`
- Create: `tests/unit/sun.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `sunTimes(date: Date, lat: number, lon: number): { sunrise: Date | null, sunset: Date | null }` — null during polar day/night.
  - `moonPhase(date: Date): { fraction: number, name: string }`
  - `describeWeatherCode(code: number): string`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/sun.spec.ts
import { describe, expect, it } from 'vitest'
import { moonPhase, sunTimes } from '../../app/utils/sun'
import { describeWeatherCode } from '../../app/utils/weather-codes'

/** Long Beach, Mississippi. */
const LAT = 30.35
const LON = -89.15

function hhmmUtc(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

describe('sunTimes', () => {
  // NOAA gives 2026-06-21 sunrise 10:57 UTC, sunset 01:04 UTC (next day) for
  // Long Beach MS. Allow a few minutes: this is the simplified sunrise equation.
  it('computes summer solstice sunrise within a few minutes of NOAA', () => {
    const { sunrise } = sunTimes(new Date(Date.UTC(2026, 5, 21, 12)), LAT, LON)
    expect(sunrise).not.toBeNull()
    const minutes = sunrise!.getUTCHours() * 60 + sunrise!.getUTCMinutes()
    expect(Math.abs(minutes - (10 * 60 + 57))).toBeLessThanOrEqual(6)
  })

  it('puts sunset after sunrise on the same day', () => {
    const { sunrise, sunset } = sunTimes(new Date(Date.UTC(2026, 2, 21, 12)), LAT, LON)
    expect(sunrise).not.toBeNull()
    expect(sunset).not.toBeNull()
    expect(sunset!.getTime()).toBeGreaterThan(sunrise!.getTime())
  })

  it('gives roughly twelve hours of daylight at the equinox', () => {
    const { sunrise, sunset } = sunTimes(new Date(Date.UTC(2026, 2, 21, 12)), LAT, LON)
    const hours = (sunset!.getTime() - sunrise!.getTime()) / 3_600_000
    expect(hours).toBeGreaterThan(11.7)
    expect(hours).toBeLessThan(12.5)
  })

  it('returns null inside the Arctic circle during polar night', () => {
    const { sunrise, sunset } = sunTimes(new Date(Date.UTC(2026, 11, 21, 12)), 78.2, 15.6)
    expect(sunrise).toBeNull()
    expect(sunset).toBeNull()
  })

  it('is stable regardless of the time of day passed in', () => {
    const a = sunTimes(new Date(Date.UTC(2026, 5, 21, 0)), LAT, LON)
    const b = sunTimes(new Date(Date.UTC(2026, 5, 21, 23)), LAT, LON)
    expect(hhmmUtc(a.sunrise!)).toBe(hhmmUtc(b.sunrise!))
  })
})

describe('moonPhase', () => {
  it('reports a new moon on a known new moon', () => {
    // 2026-01-18 was a new moon.
    const { name, fraction } = moonPhase(new Date(Date.UTC(2026, 0, 18, 19, 52)))
    expect(name).toBe('new')
    expect(fraction).toBeLessThan(0.05)
  })

  it('reports a full moon about half a synodic month later', () => {
    const { name } = moonPhase(new Date(Date.UTC(2026, 1, 2, 7, 9)))
    expect(name).toBe('full')
  })

  it('always returns a fraction in range', () => {
    for (let day = 0; day < 40; day++) {
      const { fraction } = moonPhase(new Date(Date.UTC(2026, 0, 1 + day)))
      expect(fraction).toBeGreaterThanOrEqual(0)
      expect(fraction).toBeLessThanOrEqual(1)
    }
  })
})

describe('describeWeatherCode', () => {
  it('maps the common WMO codes', () => {
    expect(describeWeatherCode(0)).toBe('clear')
    expect(describeWeatherCode(3)).toBe('overcast')
    expect(describeWeatherCode(61)).toBe('light rain')
    expect(describeWeatherCode(95)).toBe('thunderstorm')
  })

  it('falls back rather than throwing on an unknown code', () => {
    expect(describeWeatherCode(999)).toBe('unknown')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/sun.spec.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the astronomy**

```ts
// app/utils/sun.ts
/**
 * Sunrise, sunset and moon phase, computed locally.
 *
 * Open-Meteo would return sunrise/sunset, but this needs no network call and
 * works for any date, which keeps the weather panel useful even when the
 * forecast request fails. Uses the standard simplified sunrise equation —
 * accurate to a few minutes, which is all a dashboard needs.
 */

const RAD = Math.PI / 180
const J1970 = 2440588
const J2000 = 2451545

const toJulian = (date: Date) => date.valueOf() / 86_400_000 - 0.5 + J1970
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * 86_400_000)

/**
 * Sunrise and sunset in UTC. Returns nulls when the sun never crosses the
 * horizon that day (polar day or polar night), which is a real condition and
 * not an error.
 */
export function sunTimes(date: Date, lat: number, lon: number): {
  sunrise: Date | null
  sunset: Date | null
} {
  // Work from midnight UTC so the result does not depend on the time passed in.
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const n = Math.round(toJulian(new Date(midnight)) - J2000 - 0.0009 + lon / 360)

  const meanSolarNoon = 0.0009 - lon / 360 + n
  const M = (357.5291 + 0.98560028 * meanSolarNoon) % 360
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD)
  const lambda = (M + C + 180 + 102.9372) % 360
  const transit = J2000 + meanSolarNoon + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD)

  const declination = Math.asin(Math.sin(lambda * RAD) * Math.sin(23.44 * RAD))

  // -0.833 degrees accounts for refraction and the solar disc's radius.
  const cosOmega = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(declination))
    / (Math.cos(lat * RAD) * Math.cos(declination))

  if (cosOmega > 1 || cosOmega < -1) return { sunrise: null, sunset: null }

  const omega = Math.acos(cosOmega) / RAD
  return {
    sunrise: fromJulian(transit - omega / 360),
    sunset: fromJulian(transit + omega / 360),
  }
}

const SYNODIC = 29.530588853
/** A known new moon: 2000-01-06 18:14 UTC. */
const KNOWN_NEW_MOON = 2451550.26

const PHASE_NAMES = [
  'new', 'waxing crescent', 'first quarter', 'waxing gibbous',
  'full', 'waning gibbous', 'last quarter', 'waning crescent',
] as const

/**
 * Moon phase as a 0..1 fraction through the synodic month, plus a name.
 * 0 is new, 0.5 is full.
 */
export function moonPhase(date: Date): { fraction: number, name: string } {
  const age = (((toJulian(date) - KNOWN_NEW_MOON) % SYNODIC) + SYNODIC) % SYNODIC
  const fraction = age / SYNODIC

  // Eight equal arcs centred on the named phases.
  const index = Math.floor((fraction + 1 / 16) * 8) % 8
  return { fraction, name: PHASE_NAMES[index]! }
}
```

```ts
// app/utils/weather-codes.ts
/**
 * WMO weather interpretation codes, as returned by Open-Meteo.
 * https://open-meteo.com/en/docs — "Weather variable documentation".
 */
const CODES: Record<number, string> = {
  0: 'clear',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'rime fog',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'heavy drizzle',
  56: 'freezing drizzle',
  57: 'freezing drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  66: 'freezing rain',
  67: 'freezing rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  77: 'snow grains',
  80: 'light showers',
  81: 'showers',
  82: 'violent showers',
  85: 'snow showers',
  86: 'heavy snow showers',
  95: 'thunderstorm',
  96: 'thunderstorm with hail',
  99: 'thunderstorm with hail',
}

export function describeWeatherCode(code: number): string {
  return CODES[code] ?? 'unknown'
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run tests/unit/sun.spec.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add app/utils/sun.ts app/utils/weather-codes.ts tests/unit/sun.spec.ts
git commit -m "feat: compute sunrise, sunset and moon phase locally

No network call and works for any date, so the weather panel stays useful
even when the forecast request fails. Verified against NOAA times.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Weather panel

**Files:**
- Create: `app/composables/useGeolocation.ts`, `app/composables/useWeather.ts`, `app/components/tui/BrailleChart.vue`
- Modify: `app/components/panels/WeatherPanel.vue`, `app/data/profile.ts`
- Create: `tests/unit/weather.spec.ts`, `tests/e2e/weather.spec.ts`

**Interfaces:**
- Consumes: `brailleChart`, `describeSeries` (Task 1); `sunTimes`, `moonPhase`, `describeWeatherCode` (Task 8); `TuiPanel` (Task 4).
- Produces:
  - `FALLBACK_COORDS: { lat: number, lon: number, label: string }` exported from `useGeolocation`.
  - `useGeolocation(): { coords: Ref<Coords>, source: Ref<'default' | 'geolocation'> }` where `Coords = { lat: number, lon: number, label: string }`
  - `toForecast(payload: unknown): Forecast | null` — pure, exported from `useWeather`.
  - `Forecast = { tempNow: number, code: number, hourly: number[], hourStart: number }`
  - `useWeather(coords: Ref<Coords>): { forecast: Ref<Forecast | null>, status: Ref<'idle'|'loading'|'ready'|'error'> }`

- [ ] **Step 1: Write the failing unit test**

```ts
// tests/unit/weather.spec.ts
import { describe, expect, it } from 'vitest'
import { toForecast } from '../../app/composables/useWeather'

const valid = {
  current: { temperature_2m: 74.1, weather_code: 2 },
  hourly: {
    time: ['2026-09-15T00:00', '2026-09-15T01:00', '2026-09-15T02:00'],
    temperature_2m: [70.2, 69.4, 68.8],
  },
}

describe('toForecast', () => {
  it('maps a valid Open-Meteo payload', () => {
    const f = toForecast(valid)!
    expect(f.tempNow).toBe(74)
    expect(f.code).toBe(2)
    expect(f.hourly).toEqual([70, 69, 69])
    expect(f.hourStart).toBe(0)
  })

  it('reads the starting hour so the axis can be labelled', () => {
    const f = toForecast({
      ...valid,
      hourly: { time: ['2026-09-15T13:00'], temperature_2m: [80] },
    })!
    expect(f.hourStart).toBe(13)
  })

  // A malformed payload must not blank the panel with NaN.
  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['an empty object', {}],
    ['missing current', { hourly: valid.hourly }],
    ['missing hourly', { current: valid.current }],
    ['non-numeric temperature', { current: { temperature_2m: 'warm', weather_code: 0 }, hourly: valid.hourly }],
    ['mismatched hourly arrays', { current: valid.current, hourly: { time: ['2026-09-15T00:00'], temperature_2m: [] } }],
  ])('returns null for %s', (_label, payload) => {
    expect(toForecast(payload)).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run tests/unit/weather.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Add the fallback location to profile data**

In `app/data/profile.ts`, add to the `profile` object (the panel must never hardcode a place — CLAUDE.md content rules):

```ts
  /** Fallback for the weather panel when geolocation is unavailable. */
  coords: { lat: 30.35, lon: -89.15 },
```

And to the `Profile` interface in `app/types/content.ts`:

```ts
  /** Fallback coordinates for the weather panel, paired with `location`. */
  coords: { lat: number, lon: number }
```

- [ ] **Step 4: Write the geolocation composable**

```ts
// app/composables/useGeolocation.ts
import { onMounted, ref } from 'vue'
import { profile } from '~/data/profile'

export interface Coords {
  lat: number
  lon: number
  label: string
}

/**
 * Where the weather panel points when we have nothing better: Andrew's own
 * location. Never an empty panel, and it incidentally tells a recruiter his
 * timezone.
 */
export const FALLBACK_COORDS: Coords = {
  lat: profile.coords.lat,
  lon: profile.coords.lon,
  label: profile.location,
}

/** Coarsen before anything leaves the browser — ~1km is plenty for weather. */
function round(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Requests geolocation on load, per the spec.
 *
 * Denial, timeout and error are all non-events: we stay on the fallback with no
 * error state and no nagging. A visitor who says no should not be punished with
 * a broken-looking panel.
 *
 * A crosshairs control plus manual zip/city entry is a planned follow-up
 * (spec §9); it will replace the on-load prompt.
 */
export function useGeolocation() {
  const coords = ref<Coords>(FALLBACK_COORDS)
  const source = ref<'default' | 'geolocation'>('default')

  onMounted(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        coords.value = {
          lat: round(position.coords.latitude),
          lon: round(position.coords.longitude),
          label: 'your location',
        }
        source.value = 'geolocation'
      },
      () => {
        // Denied, timed out or unavailable. Stay on the fallback, silently.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    )
  })

  return { coords, source }
}
```

- [ ] **Step 5: Write the weather composable**

```ts
// app/composables/useWeather.ts
import { ref, watch, type Ref } from 'vue'
import type { Coords } from '~/composables/useGeolocation'

export interface Forecast {
  tempNow: number
  code: number
  /** Hourly temperatures, whole degrees. */
  hourly: number[]
  /** Hour-of-day of `hourly[0]`, for axis labels. */
  hourStart: number
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
    hourly?: { time?: unknown, temperature_2m?: unknown }
  }

  const temp = p.current?.temperature_2m
  const code = p.current?.weather_code
  const times = p.hourly?.time
  const temps = p.hourly?.temperature_2m

  if (!isNumber(temp) || !isNumber(code)) return null
  if (!Array.isArray(times) || !Array.isArray(temps)) return null
  if (times.length === 0 || times.length !== temps.length) return null
  if (!temps.every(isNumber)) return null

  const firstHour = /T(\d{2}):/.exec(String(times[0]))?.[1]
  if (firstHour === undefined) return null

  return {
    tempNow: Math.round(temp),
    code,
    hourly: temps.map(t => Math.round(t)),
    hourStart: Number(firstHour),
  }
}

function cacheKey(c: Coords) {
  return `${CACHE_PREFIX}${c.lat},${c.lon}`
}

function readCache(c: Coords): Forecast | null {
  try {
    const raw = localStorage.getItem(cacheKey(c))
    if (!raw) return null
    const { at, forecast } = JSON.parse(raw) as { at: number, forecast: Forecast }
    return Date.now() - at < TTL_MS ? forecast : null
  }
  catch {
    return null
  }
}

function writeCache(c: Coords, forecast: Forecast) {
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
      + '&hourly=temperature_2m&forecast_days=1'
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

  watch(coords, load, { immediate: true })

  return { forecast, status }
}
```

- [ ] **Step 6: Build the braille chart component**

```vue
<!-- app/components/tui/BrailleChart.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { brailleChart, describeSeries } from '~/utils/graph'

/**
 * Multi-row braille curve, the linecast-style rendering. Glyphs are decorative;
 * the hidden summary carries the numbers.
 */
const props = withDefaults(defineProps<{
  values: readonly number[]
  unit?: string
  width?: number
  height?: number
  label: string
}>(), { unit: '', width: 24, height: 3 })

const rows = computed(() =>
  brailleChart([...props.values], { width: props.width, height: props.height }))

const summary = computed(() => `${props.label}: ${describeSeries([...props.values], props.unit)}`)

const bounds = computed(() => {
  const usable = [...props.values].filter(Number.isFinite)
  return usable.length ? { hi: Math.max(...usable), lo: Math.min(...usable) } : null
})
</script>

<template>
  <div class="chart">
    <div class="chart__plot" aria-hidden="true">
      <div v-if="bounds" class="chart__axis">
        <span>{{ bounds.hi }}</span>
        <span>{{ bounds.lo }}</span>
      </div>
      <pre class="chart__rows">{{ rows.join('\n') }}</pre>
    </div>
    <span class="visually-hidden">{{ summary }}</span>
  </div>
</template>

<style scoped>
.chart__plot { display: flex; gap: 1ch; align-items: stretch; }

.chart__axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: var(--muted);
  font-size: var(--text-status);
}

.chart__rows {
  margin: 0;
  color: var(--accent);
  line-height: 1;
  font-family: var(--font-mono);
}
</style>
```

- [ ] **Step 7: Render the weather panel**

```vue
<!-- app/components/panels/WeatherPanel.vue -->
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
 * Sun and moon are computed locally, so they render even when the forecast
 * request fails.
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
  <TuiPanel :title="`wx · ${coords.label}`" :rows="8">
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

    <p class="astro">
      <span><span aria-hidden="true">☀ </span>{{ hhmm(sun.sunrise) }}</span>
      <span><span aria-hidden="true">☽ </span>{{ hhmm(sun.sunset) }}</span>
      <span><span aria-hidden="true">☾ </span>{{ moon.name }}</span>
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

.astro {
  display: flex;
  gap: 2ch;
  flex-wrap: wrap;
  margin: 0.25rem 0 0;
  color: var(--muted);
}
</style>
```

- [ ] **Step 8: Write the e2e test**

```ts
// tests/e2e/weather.spec.ts
import { expect, test } from '@playwright/test'

/** Never hit the live API from CI. */
const PAYLOAD = {
  current: { temperature_2m: 74.1, weather_code: 2 },
  hourly: {
    time: Array.from({ length: 24 }, (_, i) => `2026-09-15T${String(i).padStart(2, '0')}:00`),
    temperature_2m: Array.from({ length: 24 }, (_, i) => 65 + Math.round(10 * Math.sin(i / 3))),
  },
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api.open-meteo.com/**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PAYLOAD) }))
})

test.describe('weather panel', () => {
  test('falls back silently when geolocation is denied', async ({ page, context }) => {
    await context.clearPermissions()
    await page.goto('/')

    const panel = page.getByRole('region', { name: /^wx/ })
    await expect(panel).toContainText('Long Beach, MS')
    await expect(panel).toContainText('74°F')
    // Denial is a non-event: no error text anywhere in the panel.
    await expect(panel).not.toContainText('unavailable')
  })

  test('uses the visitor location when geolocation is granted', async ({ page, context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 34.73, longitude: -86.58 })
    await page.goto('/')

    await expect(page.getByRole('region', { name: /^wx/ })).toContainText('your location')
  })

  test('still shows sun and moon when the forecast request fails', async ({ page }) => {
    await page.route('**/api.open-meteo.com/**', route => route.abort())
    await page.goto('/')

    const panel = page.getByRole('region', { name: /^wx/ })
    await expect(panel).toContainText('forecast unavailable')
    // Sun/moon are computed locally, so they survive.
    await expect(panel).toContainText(/waxing|waning|full|new|quarter/)
  })

  test('the temperature chart carries a text summary', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/Hourly temperature: .*°F/)).toBeAttached()
  })
})
```

- [ ] **Step 9: Run the full gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: PASS, including the four weather e2e tests.

- [ ] **Step 10: Commit**

```bash
git add app/composables/useGeolocation.ts app/composables/useWeather.ts \
  app/components/tui/BrailleChart.vue app/components/panels/WeatherPanel.vue \
  app/data/profile.ts app/types/content.ts \
  tests/unit/weather.spec.ts tests/e2e/weather.spec.ts
git commit -m "feat: add weather panel with braille forecast curve

Geolocation on load; denial silently keeps Andrew's location with no error
state. Open-Meteo needs no API key and only coarsened coordinates leave the
browser. Sun and moon are local, so they survive a failed forecast.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Theme picker placement and help overlay

Gives the ten themes a visible control, since `t` needs a click equivalent.

**Files:**
- Modify: `app/layouts/default.vue`, `app/components/tui/HelpOverlay.vue`
- Create: `tests/e2e/themes.spec.ts`

**Interfaces:**
- Consumes: `ThemePicker` (Task 3), `useTheme` (Task 3), `TuiPanel` (Task 4).
- Produces: nothing downstream.

- [ ] **Step 1: Write the failing e2e test**

```ts
// tests/e2e/themes.spec.ts
import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

test.describe('theme picker', () => {
  test('lists every theme and marks the current one', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByRole('button', { name: 'Keyboard shortcuts' }).click()

    const group = page.getByRole('radiogroup', { name: 'Colour theme' })
    await expect(group.getByRole('radio')).toHaveCount(10)
    await expect(group.getByRole('radio', { checked: true })).toHaveCount(1)
  })

  test('clicking a theme applies and persists it', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByRole('button', { name: 'Keyboard shortcuts' }).click()
    await page.getByRole('radio', { name: 'gruvbox' }).click()

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'gruvbox')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'gruvbox')
  })

  test('every theme keeps the page readable', async ({ page }) => {
    // Cycling all ten must never leave a token unset or a panel invisible.
    await gotoHydrated(page, '/')
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('t')
      await expect(page.getByRole('region', { name: 'whoami' })).toBeVisible()
      const bg = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())
      expect(bg).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec playwright test tests/e2e/themes.spec.ts --project=desktop`
Expected: FAIL — no radiogroup named "Colour theme".

- [ ] **Step 3: Put the picker in the help overlay**

The help overlay is already a focus-trapped dialog with a click equivalent for every shortcut, which makes it the natural home. In `app/components/tui/HelpOverlay.vue`, add props and a themes section after the shortcut groups and before `.dialog__note`:

```ts
// add to the existing <script setup>
import { THEME_NAMES, type Theme } from '~/composables/useTheme'

defineProps<{ theme: Theme }>()
defineEmits<{ 'select-theme': [Theme] }>()
```

```vue
        <div class="group">
          <h3 class="group__title">theme</h3>
          <TuiThemePicker :current="theme" @select="$emit('select-theme', $event)" />
        </div>
```

In `app/layouts/default.vue`, bind them:

```vue
    <TuiHelpOverlay
      v-model="helpOpen"
      :theme="theme"
      @select-theme="onThemeSelect"
    />
```

and add the handler beside `onThemeCycle`:

```ts
const { theme, cycle: cycleTheme, set: setTheme } = useTheme()

function onThemeSelect(name: Theme) {
  setTheme(name)
  flash(`theme → ${name}`)
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: PASS. Note the overlay's axe test in `a11y.spec.ts` now also covers the radiogroup.

- [ ] **Step 5: Commit**

```bash
git add app/components/tui/HelpOverlay.vue app/layouts/default.vue tests/e2e/themes.spec.ts
git commit -m "feat: add theme picker to the help overlay

Gives t a visible click equivalent and somewhere to see all ten themes.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Responsive layout and reduced motion

**Files:**
- Modify: `app/assets/css/base.css`
- Create: `tests/e2e/responsive.spec.ts`
- Modify: `tests/e2e/a11y.spec.ts`

**Interfaces:**
- Consumes: the grid from Task 4, panels from Tasks 5–9.
- Produces: nothing downstream.

- [ ] **Step 1: Write the failing e2e test**

```ts
// tests/e2e/responsive.spec.ts
import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

const WIDTHS = [320, 360, 768, 1024, 1366, 1920]

test.describe('responsive dashboard', () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth)
      expect(overflows).toBe(false)
    })
  }

  test('puts recruiter facts and content before the toys on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/')

    const whoami = (await page.getByRole('region', { name: 'whoami' }).boundingBox())!
    const main = (await page.locator('#main').boundingBox())!
    const visitor = (await page.getByRole('region', { name: 'visitor' }).boundingBox())!

    expect(whoami.y).toBeLessThan(main.y)
    expect(main.y).toBeLessThan(visitor.y)
  })

  test('freezes meters under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHydrated(page, '/')

    const read = () => page.getByRole('region', { name: 'meters' }).textContent()
    const first = await read()
    await page.waitForTimeout(2500)
    expect(await read()).toBe(first)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec playwright test tests/e2e/responsive.spec.ts --project=desktop`
Expected: FAIL on at least one width, and on the reduced-motion test (`useClock` and `useSession` still tick).

- [ ] **Step 3: Respect reduced motion in the ticking composables**

`useFrameRate` already bails under reduced motion. Do the same in `useClock` and `useSession` — a clock that updates every second is motion.

In `app/composables/useClock.ts`, replace the `onMounted` body:

```ts
  onMounted(() => {
    read()
    // A ticking clock is motion; render it once and leave it.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer = setInterval(read, 1000)
  })
```

In `app/composables/useSession.ts`, guard only the uptime interval — route tracking and the log are event-driven, not motion:

```ts
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(() => {
        seconds.value = (performance.now() - start) / 1000
        uptime.value = formatUptime(seconds.value)
      }, 1000)
    }
```

- [ ] **Step 4: Fix any overflow the test found**

Panels contain long unbreakable strings (GPU names, timezones). Add to `app/assets/css/base.css`:

```css
/* Panel bodies must never widen the grid: long GPU names and timezones are
   unbreakable strings. */
.panel__body dd,
.panel__body p {
  min-width: 0;
  overflow-wrap: anywhere;
}
```

- [ ] **Step 5: Test that panels degrade honestly without JavaScript**

Spec §8 requires that content stays readable and panels degrade to static
labels with JS off. Append to `tests/e2e/responsive.spec.ts`:

```ts
test.describe('dashboard without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('content is readable and panels show placeholders, not blanks', async ({ page }) => {
    await page.goto('/')

    // The portfolio content is prerendered, so it survives entirely.
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('region', { name: 'whoami' })).toContainText('Mad Genius')

    // Live panels still occupy their space and read as unavailable rather than empty.
    const visitor = page.getByRole('region', { name: 'visitor' })
    await expect(visitor).toBeVisible()
    await expect(visitor).toContainText('—')

    const box = (await visitor.boundingBox())!
    expect(box.height).toBeGreaterThan(0)
  })

  test('does not scroll horizontally without JS', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/')
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflows).toBe(false)
  })
})
```

Note this requires each panel's server-rendered state to show `—` rather than
nothing. `useVisitorSpecs` already seeds its rows that way; check `MetersPanel`
and `WeatherPanel` render an em-dash before hydration and fix them if not.

- [ ] **Step 6: Extend the a11y sweep to more themes**

In `tests/e2e/a11y.spec.ts`, replace the dark/light pair of tests with a theme-driven sweep:

```ts
/** A representative spread: darkest, lightest, and the two default themes. */
const THEMES = ['tokyo-night', 'catppuccin-latte', 'matte-black', 'gruvbox']

for (const route of routes) {
  for (const theme of THEMES) {
    test(`${route} has no axe violations (${theme})`, async ({ page }) => {
      await page.addInitScript(
        name => localStorage.setItem('idrewlong:theme', name), theme)
      await page.goto(route)
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      expect(results.violations).toEqual([])
    })
  }
}
```

- [ ] **Step 7: Run the full gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e`
Expected: PASS at all six widths, in four themes, with and without JavaScript,
on both Playwright projects.

- [ ] **Step 8: Commit**

```bash
git add app/assets/css/base.css app/composables/useClock.ts \
  app/composables/useSession.ts tests/e2e/responsive.spec.ts tests/e2e/a11y.spec.ts
git commit -m "fix: hold the dashboard grid together at every width

No horizontal overflow from 320px up, recruiter facts before the toys on
mobile, and every ticking composable stops under reduced motion. axe sweep
now covers four themes per route.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Budget guard, docs and final verification

**Files:**
- Create: `tests/e2e/budget.spec.ts`
- Modify: `docs/PROJECT.md`, `README.md`, `lighthouserc.json`

**Interfaces:**
- Consumes: everything.
- Produces: nothing downstream.

- [ ] **Step 1: Write the failing budget test**

```ts
// tests/e2e/budget.spec.ts
import { gunzipSync, gzipSync } from 'node:zlib'
import { expect, test } from '@playwright/test'

const BUDGET_KB = 120

test('first-view JS stays inside the budget', async ({ page }) => {
  const scripts = new Map<string, number>()

  page.on('response', async (response) => {
    const url = response.url()
    if (!url.includes('/_nuxt/') || !url.endsWith('.js')) return
    try {
      const body = await response.body()
      // Compare like-for-like: measure gzipped size regardless of transport.
      const encoding = (response.headers()['content-encoding'] ?? '').toLowerCase()
      const raw = encoding === 'gzip' ? gunzipSync(body) : body
      scripts.set(url, gzipSync(raw).length)
    }
    catch {
      // Response body already discarded; skip it.
    }
  })

  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true')

  const totalKb = [...scripts.values()].reduce((a, b) => a + b, 0) / 1024
  console.log(`first-view JS: ${totalKb.toFixed(1)} KB gz across ${scripts.size} files`)
  expect(totalKb).toBeLessThanOrEqual(BUDGET_KB)
})
```

- [ ] **Step 2: Run it**

Run: `pnpm exec playwright test tests/e2e/budget.spec.ts --project=desktop`
Expected: PASS, with the measured figure logged. If it fails, the fix is code-splitting the panels — not raising the number.

- [ ] **Step 3: Apply the spec's amendments to PROJECT.md**

Insert immediately after the `## 1. What we're building` heading's success-criteria block:

```markdown
> **Superseded in part by the v3 dashboard redesign.** See
> `docs/superpowers/specs/2026-09-15-tui-dashboard-redesign-design.md` §2 for the
> criteria this replaces — no-JS support, the JS budget, the fold rule, the §5
> palette, and the §4 screen specs. Content rules and the "never invent facts"
> rule still apply in full.
```

- [ ] **Step 4: Refresh the README**

Replace the "Current results" table figures with the measured ones, replace the `## Frame technique` section's closing line to mention the panel grid, and rewrite the first "Known gaps" bullet:

```markdown
- **JS budget.** First-view JS is measured by `tests/e2e/budget.spec.ts` against
  a 120 KB gz ceiling, which replaces the 60 KB target in `docs/PROJECT.md` §1.
  That target was never reachable while the site hydrates as a Nuxt app: the
  Vue + Nuxt + router runtime floor alone is ~67 KB.
```

Add a themes section:

```markdown
## Themes

Ten palettes derived from [Omarchy](https://github.com/basecamp/omarchy) (MIT),
vendored in `vendor/omarchy-themes/` and compiled by
`scripts/generate-themes.mjs`. `t` cycles; the picker lives in the help overlay.

None of Omarchy's palettes pass WCAG AA as authored — terminal comment colours
are far too dim for the web. The generator blends failing tokens toward the
foreground until they clear 4.6:1 against both the page and panel backgrounds.
Tokyo Night needs exactly one token moved. `tests/unit/themes.spec.ts` asserts
every generated theme stays compliant, so a resync can never quietly regress it.

Regenerate after changing a vendored palette:

```bash
pnpm generate-themes
```
```

- [ ] **Step 5: Run the whole suite plus Lighthouse**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")" pnpm lighthouse
```

Expected: all green. Lighthouse Performance ≥95, Accessibility 100, Best Practices 100, SEO 100, CLS exactly 0 on all four routes.

If CLS is above 0, the cause is a panel whose height changes when its values arrive. Find it by diffing panel `boundingBox().height` before and after `data-ready`, then fix the panel's `rows` — do not relax the assertion.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/budget.spec.ts docs/PROJECT.md README.md lighthouserc.json
git commit -m "docs: record v3 results and guard the JS budget

Applies the spec's amendments to PROJECT.md rather than leaving superseded
criteria to rot, and adds a test that fails if first-view JS exceeds 120 KB gz.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Notes for the executor

- **Never fake data.** If a browser API is unavailable, render `—` and set
  `supported: false`. This is the spec's central constraint and the reason the
  meters panel exists in the shape it does.
- **Panel heights are load-bearing.** Any panel that resizes when its values
  arrive breaks the zero-CLS requirement. Fix the `rows` prop, never the test.
- **`app/assets/css/themes.css` is generated.** Edit
  `scripts/generate-themes.mjs` or the vendored TOMLs, then regenerate.
- **The contrast test is the guard.** If it fails after a resync, the palette
  changed upstream — retune, do not lower the threshold.
- Task 4 deletes `Fastfetch.vue`; its two e2e assertions in `routes.spec.ts`
  that reference fastfetch content will need updating in that task.
