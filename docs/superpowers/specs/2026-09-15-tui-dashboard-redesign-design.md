# idrewlong.com v3 — TUI dashboard redesign

**Status:** design, awaiting approval
**Date:** 2026-09-15
**Supersedes parts of:** `docs/PROJECT.md` (see §2)

## 1. What we're building

Rebuild the site as a **btop-style live dashboard**. Reference points: `btop`
for panel density and layout, [linecast](https://awesometui.com/linecast) for
rendering continuous data as braille curves in a text grid, and
[Omarchy](https://github.com/basecamp/omarchy) for the colour themes.

Persistent live panels — the visitor's own machine specs, real-time meters,
local weather, session telemetry — surround a region that swaps between the four
existing content routes. The recruiter-facing facts keep the most valuable
position (top-left, above the fold); the dashboard is the frame around them.

The v2 build is a clean document. This is a dashboard. That is the change.

### Success criteria

- A recruiter sees role, employer, location, stack, certs and a resume link in
  the first screen without scrolling at 1366×768.
- The dashboard reads as a live system monitor within two seconds of load:
  values are populated, at least one meter is visibly moving.
- Every panel shows **real data or an honest empty state**. Nothing is
  simulated (see §4.1).
- Lighthouse Performance ≥95, Accessibility 100, Best Practices 100, SEO 100.
- Zero CLS. axe clean (WCAG 2.2 AA) on every route in every shipped theme.
- The four routes stay individually linkable, crawlable and openable in a tab.

### Non-goals

- A real shell or command parser as primary navigation.
- Faking telemetry the browser cannot provide.
- Server-side anything. The site stays statically generated.

## 2. Amendments to `docs/PROJECT.md`

These criteria are superseded. Recorded here rather than silently dropped.

| PROJECT.md | Status | Replacement |
|---|---|---|
| §1 "Works with JavaScript disabled" | **Amended** | Portfolio *content* stays prerendered and fully readable with JS off. Dashboard panels degrade to static labels with an em-dash value. No blank panels, no layout jump. |
| §1 "under ~60 KB gzipped JS" | **Replaced** | ≤120 KB gz first-view, enforced by a test. v2 already measured 85 KB; the Vue+Nuxt+router floor is ~67 KB. |
| §1 "visible without scrolling" | **Narrowed** | Still true for the `whoami` panel, which now shares the fold with other panels. |
| §5 colour tokens (`gulf-night` / `paper`) | **Replaced** | Omarchy-derived themes, §6. |
| §5 "one motion moment only" | **Replaced** | Live meters tick continuously by design. All motion stops under `prefers-reduced-motion`. |
| §4.1–4.4 screen specs | **Replaced** | §5 below. |
| §10 "ASCII art subject" | **Settled** | "iD" block-letter mark, already built. |

Everything else in PROJECT.md still holds — content rules, the "never invent
facts" rule, semantic-HTML-first, data lives in `app/data/`.

## 3. Architecture

Extend the existing Nuxt 4 app. The data layer, four routes, SEO/JSON-LD,
sitemap, token system and 72 tests all still apply; what changes is the layout
and the addition of live panels. The `.frame` CSS technique built for v2
generalises directly into the `Panel` primitive.

```
app/
  components/
    tui/         Panel (title inset in border), Sparkline, BrailleChart,
                 BarMeter, KeyValue, ThemePicker, HelpOverlay
    panels/      WhoamiPanel, VisitorPanel, MetersPanel, WeatherPanel,
                 SessionPanel
    views/       Fastfetch, GitLog, ProjectList, SkillTree   (unchanged)
  composables/   useVisitorSpecs, useFrameRate, useMemoryMeter, useNetworkInfo,
                 useBattery, useGeolocation, useWeather, useSunMoon,
                 useSession, useClock, useTheme, useKeybindings
  utils/         graph.ts (sparkline / braille / bar + text summaries)
scripts/
  generate-themes.mjs       Omarchy colors.toml -> themes.css, AA-tuned
vendor/omarchy-themes/      Vendored colors.toml files (MIT, attributed)
```

**One composable owns one data source.** Each returns a reactive value plus a
`supported` flag, so a panel can render an honest "unavailable" state rather
than a zero. No composable knows about any other.

**Rendering is text, not SVG.** Braille (`⠁⠂⠄⡀`) for curves, block characters
(`▁▂▃▅▇`) for sparklines, `█░` for bar meters. Keeps the terminal fiction
honest, adds no dependency, and every graph carries a plain-language summary for
assistive tech.

## 4. Panels

### 4.1 What the browser can and cannot give us

btop's headline feature is live CPU and RAM *utilisation*. **The web platform
does not expose either.** We will not draw a fake CPU meter — that is inventing
data, which PROJECT.md forbids for content and which would be dishonest here
too. Instead we show static specs (real) alongside genuinely live browser-side
signals (also real).

### 4.2 `whoami` — Andrew (recruiter panel, top-left)

Role, employer, location, stack, certs, resume button. Sourced from
`app/data/profile.ts`. Prerendered — correct with JS disabled.

### 4.3 `visitor` — neofetch of the visitor

| Row | Source | If unsupported |
|---|---|---|
| OS + browser + version | UA-CH `navigator.userAgentData`, UA string fallback | parsed best-effort |
| CPU cores | `navigator.hardwareConcurrency` | `—` |
| Memory | `navigator.deviceMemory` (coarse, Chromium) | `—` |
| GPU | WebGL `WEBGL_debug_renderer_info` | `—` |
| Screen | `screen.width/height`, `devicePixelRatio`, colour depth | always available |
| Input | `navigator.maxTouchPoints` → touch / pointer | always available |
| Locale | `navigator.language`, resolved IANA timezone | always available |

All local reads. Nothing is transmitted.

### 4.4 `meters` — genuinely live

- **FPS** — measured via `requestAnimationFrame`, block sparkline, ~1 s window.
- **JS heap** — `performance.memory` (Chromium only), bar meter.
- **Latency** — periodic same-origin `HEAD` timing, braille curve.
- **Connection** — `navigator.connection` effectiveType + downlink, live.
- **Battery** — `navigator.getBattery()` level + charging, live.
- **Uptime** — time on page.

Each meter pauses on `visibilitychange` and freezes under reduced motion.

### 4.5 `wx` — weather, sun and moon

- **Location:** `navigator.geolocation` requested **on load**. On denial,
  timeout or error, fall back silently to Long Beach, MS — no error state, no
  nagging. (A crosshairs + manual zip/city input is a deliberate follow-up, §9.)
- **Forecast:** [Open-Meteo](https://open-meteo.com) — free, no API key,
  CORS-enabled. Current temp, hourly temperature as a braille curve,
  precipitation probability bars, wind.
- **Sun/moon:** computed locally from lat/lon and date. No network call.
- **Cache:** response in `localStorage`, 30-minute TTL, keyed by rounded
  coordinates. Coordinates rounded to ~2 decimal places before any request.

Only this panel makes a network request, and only coarse coordinates leave the
browser. Stated plainly in the panel's accessible description.

### 4.6 `session` — terminal flavour

Current route, time on page, routes visited, keys pressed, and a short event log
(`GET /experience 200 · 12ms`) fed by real router navigations and real timings.
Garnish, but truthful garnish.

## 5. Layout

```
┌ idrewlong ───────────────────────────────────── 21:02:14 ─┐
├─ whoami ──────────┬─ visitor ────────┬─ meters ───────────┤
│ Sr Full Stack Dev │ CPU  8 cores     │ fps  ▁▂▃▅▇▅▃   60  │
│ Mad Genius        │ MEM  8 GB        │ heap ███░░░░  48M  │
│ Long Beach, MS    │ GPU  Apple M3    │ net  ↓120Mbps  4g  │
│ [resume ↓]        │ SCR  1512x982@2x │ rtt  ⠁⠂⠄⡀⢀⠠  42ms │
├───────────────────┴──────────────────┴────────────────────┤
│ [1] info   [2] experience   [3] projects   [4] skills     │
│                                                           │
│        ← swappable region (the portfolio content)         │
│                                                           │
├─ wx · Long Beach, MS ─────────────┬─ session ─────────────┤
│ 74°F partly cloudy                │ uptime    00:01:23    │
│ 84 ⠊⠑⠢⡠⢄                         │ route     /           │
│ ☀06:21 ☽17:58 ☾ waxing gibbous    │ GET /experience 200   │
└───────────────────────────────────┴───────────────────────┘
```

CSS Grid with named areas. **Every panel has a fixed height** at each
breakpoint — this is what keeps CLS at zero when values populate on hydration.

- **≥1200px** — full grid as drawn.
- **768–1199px** — side panels collapse to a two-column band above the content.
- **<768px** — single column: `whoami`, content, then `visitor` / `meters` /
  `wx` / `session` stacked below. Recruiter facts and content stay first.

## 6. Themes

Generated from Omarchy's `colors.toml` files (MIT, © David Heinemeier Hansson —
attributed in `vendor/omarchy-themes/README.md`). Source TOMLs are vendored so
builds are reproducible offline.

**Mapping:** `background`→`--bg`, `lighter_background`→`--surface`,
`muted`→`--line`, `foreground`→`--fg`, `dark_foreground`→`--muted`,
`accent`→`--accent`, `red`→`--danger`. `--link` picks the first of
cyan/green/magenta whose hue differs from `--accent` by >40°, so links never
collide with the accent.

**Contrast tuning is mandatory.** Not one of Omarchy's 22 themes passes WCAG AA
when mapped naively — terminal comment colours are far too dim (Tokyo Night's
secondary text is 2.4:1 against the panel background). `generate-themes.mjs`
blends each failing token toward the foreground until it clears 4.6:1 against
both `--bg` and `--surface`. Tokyo Night needs exactly one token changed
(`#565f89` → `#878FB6`), drifting 12/255 — the themes stay recognisable.

**Shipping ten:** tokyo-night (default), kanagawa, catppuccin, gruvbox,
everforest, osaka-jade, matte-black, ristretto, rose-pine (light),
catppuccin-latte (light).

`t` cycles; the picker is also a clickable panel. Choice persists in
`localStorage`; first visit honours `prefers-color-scheme` by selecting the
default dark or light theme. Applied as `data-theme` on `<html>` by the existing
pre-paint inline script, so there is no flash and no shift.

## 7. Accessibility

The dashboard aesthetic must not cost the 100 score.

- Each panel is a `<section>` with a real heading; the visible title sits in the
  border via the `.frame` technique.
- Graph glyphs are `aria-hidden`; each graph is followed by a visually-hidden
  summary ("hourly forecast: 62°F at midnight, rising to 84°F at 2pm").
- Ticking meters are **not** live regions — `aria-live="off"` — so screen
  readers are never spammed. The status line keeps its existing polite region
  for deliberate confirmations only.
- `prefers-reduced-motion` freezes every meter at its current value.
- All interactive targets ≥24×24px (WCAG 2.2).
- Every theme verified by an automated contrast test (§8), not by eye.

## 8. Testing

**Unit (Vitest)**
- `graph.ts`: sparkline/braille/bar output for known inputs, empty series,
  single value, all-equal values, NaN handling.
- Theme generation: **every generated theme passes AA for all token pairs** —
  the guard that keeps the palette honest.
- Weather response → view-model mapping, including a malformed payload.
- Sun/moon math against known values for a fixed date and location.
- UA parsing for a table of real user-agent strings.
- Existing data-integrity and keybinding tests carry over unchanged.

**E2E (Playwright + axe)**
- axe clean on all four routes plus 404, in the default dark and light themes,
  and a smoke pass across all ten.
- Geolocation **denied** → panel shows the fallback location, no error state.
- Geolocation **granted** (mocked coords) → panel shows that location.
- Open-Meteo stubbed via route interception — no live network in CI.
- Panels render placeholders with JS disabled; content remains readable.
- `prefers-reduced-motion` freezes meters.
- No horizontal overflow at 320/360/768/1366.
- First-view JS ≤120 KB gz.

**Lighthouse CI** — thresholds unchanged, CLS still asserted at 0.

## 9. Out of scope (deliberate follow-ups)

- **Crosshairs + manual zip/city input** for the weather panel. Agreed as a
  separate change after this lands; geolocation-on-load ships first.
- Radar imagery, tides, planetarium (linecast has these; we are not porting them).
- `public/resume.pdf`, Commit Mono woff2 files, `/og.png` — still missing, still
  tracked in README "Known gaps".

## 10. Open questions

- Does the `session` event log risk reading as fake? If it looks simulated in
  practice, cut it — the other four panels carry the concept.
- Ten themes may be more than anyone wants. If the picker feels like clutter
  after it is built, trim to four.
