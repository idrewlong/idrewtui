# idrewlong.com

Andrew Long's portfolio, built as a **btop-style terminal dashboard** — live panels
around a content region, rendered entirely in text and CSS.

Everything on screen is measured or sourced. Nothing is simulated: values the
browser will not supply render as `—`, never as a plausible-looking zero.

- **Original spec:** [`docs/PROJECT.md`](docs/PROJECT.md) — the v2 document-style
  site. Partly superseded; see §2 of the redesign spec below.
- **Redesign spec:** [`docs/superpowers/specs/2026-09-15-tui-dashboard-redesign-design.md`](docs/superpowers/specs/2026-09-15-tui-dashboard-redesign-design.md)
- **Agent guidance:** [`CLAUDE.md`](CLAUDE.md)

## Stack

Nuxt 4 (static via `nuxt generate`) · TypeScript strict · Tailwind CSS v4 with
CSS-variable tokens · Vitest · Playwright + axe · Lighthouse CI · pnpm.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Dev server |
| `pnpm generate` | Fetch GitHub data, build themes, static build to `.output/public` |
| `pnpm preview` | Serve the static build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `vue-tsc` via `nuxt typecheck` |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright, incl. axe scans |
| `pnpm generate-themes` | Rebuild `themes.css` from the vendored palettes |
| `pnpm fetch-github` | Refresh `app/data/github.json` |
| `pnpm generate-og` | Re-screenshot `public/og.png` from the live dashboard |
| `pnpm lighthouse` | Lighthouse CI against the static build |

Before calling a task done: `pnpm lint && pnpm typecheck && pnpm test`.
For UI changes, also `pnpm test:e2e`.

`pnpm lighthouse` needs a Chrome binary; Playwright's works:

```bash
CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")" pnpm lighthouse
```

## Current state

| Check | Result |
|-------|--------|
| Unit tests | **234 passing** |
| E2E tests | **122 passing**, incl. axe scans on every route |
| Lint / typecheck | clean |
| Static build | succeeds |
| First-view JS | ~101 KB gzipped |

## The dashboard

Six panels surround a content region that swaps between four routes.

```
┌ whoami ────────┬ visitor ───────┬ meters ────────┐
│ role, employer │ their OS,      │ fps sparkline  │
│ stack, certs   │ browser, CPU,  │ heap, net, rtt │
│ [resume ↓]     │ GPU, screen    │ battery,       │
│ + iD mark      │ + coarsening   │ frametime      │
│                │   caveat       │   braille chart│
├────────────────┴────────────────┴────────────────┤
│ [1] info  [2] experience  [3] projects  [4] skills│
│                                                  │
│            ← swappable content region            │
│                                                  │
├ wx ───────────────────────────┬ session ─────────┤
│ temp, braille forecast curve, │ clock, uptime,   │
│ rain bar, sun/moon            │ route, real nav  │
│ + privacy line                │ log with timings │
└───────────────────────────────┴──────────────────┘
```

A `github` panel renders build-time public activity from `app/data/github.json`.

**Panels are fixed-height by design.** `<TuiPanel :rows="N">` pins the body via
`calc(rows * 1.6em)`, which is what holds CLS at zero when values populate on
hydration. If content does not fit, change `rows` — never the assertion. E2E
guards in `tests/e2e/dashboard.spec.ts` check both clipping and height stability
for each panel.

Note `.panel__body` carries ~12px of rem padding that eats into that border-box
height, so the right `rows` value is always a measured number, not a guessed one.

## Overlay toolkit

| Key | Opens |
|-----|-------|
| `:` | Command palette (fuzzy-matched actions) |
| `/` | Find in page, with `n` / `N` to step matches |
| `m` | Compose email |
| `?` | Keyboard help + theme picker |
| `Esc` | Close any overlay |

Built on a shared `Overlay` primitive with focus trapping and restore.
`Cast.vue` is a small asciinema v2 player for terminal recordings.

## Keyboard

Every shortcut is declared once in `app/composables/useKeybindings.ts`, which also
feeds the help overlay. Each has a visible click equivalent.

```
1-4  switch tab          y  copy email         :  command palette
h/l  prev / next tab     Y  copy recruiter card /  find in page
j/k  move selection      m  compose email      n/N find next / prev
g/G  top / bottom        r  open resume PDF    t  cycle theme
Enter open row           f  cycle filter       ?  help    Esc close
```

## Themes

Ten palettes derived from [Omarchy](https://github.com/basecamp/omarchy) (MIT),
vendored in `vendor/omarchy-themes/` and compiled by `scripts/generate-themes.mjs`.
`t` cycles; the picker lives in the help overlay.

**None of Omarchy's palettes pass WCAG AA as authored** — terminal comment colours
are far too dim for the web (Tokyo Night's secondary text is 2.4:1 against the
panel background). The generator blends failing tokens toward the foreground until
they clear 4.6:1 against both the page and panel backgrounds. Tokyo Night needs
exactly one token moved. `tests/unit/themes.spec.ts` asserts every generated theme
stays compliant, so a resync can never quietly regress it.

Every theme also emits an opaque `--surface-hi` for selected/hovered rows, tuned to
the same AA bar. That token exists because translucent `color-mix()` highlights once
created a third, unvalidated background and quietly broke contrast on `/projects` and
in the command palette. Use `var(--surface-hi)` for any background behind text —
never a translucent blend, whose contrast depends on whatever sits behind it.

`app/assets/css/themes.css` is **generated and gitignored**. Never hand-edit it.

## Plain-text endpoints

For anyone who would rather curl than click:

```bash
curl https://idrewlong.com/index.txt     # site index
curl https://idrewlong.com/resume.txt    # plaintext resume
```

Both are prerendered from `app/utils/resume.ts`, so they cannot drift from the
typed data the site renders.

## Editing content

Every fact lives in `app/data/*.ts`, typed by `app/types/content.ts`. Components
never hardcode names, dates, employers, or links.

**Nothing is invented.** Unknowns are marked `TODO(andrew)` and render as a visible
placeholder rather than a guess:

```bash
grep -rn "TODO(andrew)" app public
```

Two fields are opt-in and off by default, since the site is public and the current
employer can see it:

- `profile.status` — `'Open to conversations'` / `'Open to work'`; `'hidden'` renders no row.
- `profile.workAuthorization` — `null` renders no row.

## Known gaps

Tracked rather than silently shipped.

**Needs a decision from Andrew — do not guess:**

- **Certifications.** The live site lists only CompTIA Security+. This data also
  claims AWS Solutions Architect (in progress) and FAA Part 107 (earned), both
  sourced from `docs/PROJECT.md` rather than the site. Confirm or remove — an
  overstated credential is the costliest error on a portfolio.
- **17 `TODO(andrew)` markers** — one-liners and repo links for Shrinkr and Morphr,
  canonical URLs for the three articles, repos for skill-mgr and snapr, outcome
  bullets for Thompson Machinery and Finder's Guide, the Ole Miss degree question,
  and the projects hidden behind "Show more" on the live site.
- **Two opt-in flags**, both currently off: `profile.status` and
  `profile.workAuthorization`.

**Other gaps:**

- **JS budget.** First-view JS is ~101 KB gz against the 60 KB target in
  `docs/PROJECT.md` §1. That target was never reachable while the site hydrates as
  a Nuxt app — the Vue + Nuxt + router runtime floor alone is ~67 KB. The redesign
  spec §2 replaces it with a 120 KB ceiling.
- **Commit Mono is not bundled.** See `public/fonts/README.md`. The fallback
  monospace stack is used until the woff2 files are added.
- **Open content questions** from `docs/PROJECT.md` §10 remain marked `TODO(andrew)`
  in the data files.

**Removed:** a precipitation radar (RainViewer tiles rendered as braille) was built
and then taken out in `a291e78`. It worked, but without a basemap under it there
was no geographic structure to read it against.

## Frame technique

The chrome is one continuous frame with the tab bar inset in its top border and the
status line inset in its bottom. The border is a pseudo-element inset by half a row,
and the bars that cross it carry the surface background so they mask the line behind
them — see `.frame` in `app/assets/css/base.css`. `Panel.vue` applies the same idea
per panel.

Ported from [WebTUI](https://webtui.ironclad.sh)'s `box-="square" shear-="both"`
(MIT). It is **not** a dependency: WebTUI is at v0.1.10, its theme model
(`--background0..3` / `--foreground0..2`) does not map onto our semantic tokens, and
its `@layer base/components` names collide with Tailwind v4's. This was the one
utility worth having, and it is ~20 lines.

## Testing notes

- **No e2e test may reach a live third-party API.** `tests/e2e/helpers.ts` exports a
  `test` fixture that auto-stubs outbound weather requests; specs import from there,
  never from `@playwright/test` directly. An ESLint `no-restricted-imports` rule
  enforces it, because the convention alone did not — the suite silently called the
  live Open-Meteo API on every page load until that was caught.
- The weather fetch is gated behind `onMounted` so `nuxt generate` never calls the
  network at build time.

## Analytics

Off unless `NUXT_PUBLIC_GTM_ID` is set. Events are declared in
`app/utils/analytics.ts` and sent through `track()`; the container loads after idle.

## Deploying

Static output goes to `.output/public`. `public/_redirects` covers Cloudflare Pages;
`routeRules` in `nuxt.config.ts` covers dev and preview. Keep the two in sync.
