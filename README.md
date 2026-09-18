# idrewlong.com v2

Andrew Long's portfolio, built as a terminal-UI styled static site.

Four routes presented as numbered tabs, with a `fastfetch`-style summary,
keyboard shortcuts, and a resume link on every view — over semantic HTML that
stays readable without a keyboard or JavaScript.

- **Spec:** [`docs/PROJECT.md`](docs/PROJECT.md) — scope, wireframes, design
  system, and content rules. Source of truth.
- **Agent guidance:** [`CLAUDE.md`](CLAUDE.md)

## Stack

Nuxt 4 (static via `nuxt generate`) · TypeScript strict · Tailwind CSS v4 with
CSS-variable tokens · Vitest · Playwright + axe · pnpm.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Dev server |
| `pnpm generate` | Static build to `.output/public` |
| `pnpm preview` | Serve the static build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `vue-tsc` via `nuxt typecheck` |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright, incl. an axe scan on every route |
| `pnpm lighthouse` | Lighthouse CI against the static build |

Before calling a task done: `pnpm lint && pnpm typecheck && pnpm test`.
For UI changes, also `pnpm test:e2e`.

`pnpm lighthouse` needs a Chrome binary; Playwright's works:

```bash
CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")" pnpm lighthouse
```

## Current results

| Check | Result |
|-------|--------|
| Lighthouse (all 4 routes) | Performance / Accessibility / Best Practices / SEO all **100** |
| Cumulative Layout Shift | **0** |
| Largest Contentful Paint | ~445 ms |
| axe (WCAG 2.2 AA) | 0 violations — 5 routes × dark and light |
| Unit tests | 42 passing |
| E2E tests | 72 passing (desktop + mobile) |

## Layout

```
app/
  assets/css/     tokens.css (palette, type scale), base.css (box-drawing helpers)
  components/
    tui/          Pane, TabBar, StatusLine, Rule, LeaderRow, Prompt, Cursor,
                  HelpOverlay, AsciiArt
    views/        Fastfetch, GitLog, ProjectList, SkillTree
  composables/    useKeybindings, useTheme, useClipboard, useSelection,
                  useStatusLine, usePageShortcuts
  data/           profile, experience, projects, skills, writing, navigation
  layouts/        default.vue
  pages/          index, experience, projects, skills, [...slug] (404)
  plugins/        analytics.client.ts
  types/          content.ts
  utils/          analytics.ts, format.ts
server/routes/    sitemap.xml.ts
public/           robots.txt, _redirects, favicon.svg, fonts/
tests/            unit/ (Vitest), e2e/ (Playwright + axe)
docs/             PROJECT.md
```

## Editing content

Every fact on the site lives in `app/data/*.ts`, typed by `app/types/content.ts`.
Components never hardcode names, dates, employers, or links.

**Nothing is invented.** Unknowns are marked `TODO(andrew)` in the data files
and render as a visible placeholder rather than a guess. Search for them with:

```bash
grep -rn "TODO(andrew)" app public
```

Two fields are opt-in and off by default, since the site is public and the
current employer can see it (`docs/PROJECT.md` §6):

- `profile.status` — set to `'Open to conversations'` or `'Open to work'`;
  `'hidden'` renders no row at all.
- `profile.workAuthorization` — `null` renders no row.

## Known gaps

These are tracked rather than silently shipped:

- **JS budget.** First-view JS is ~85 KB gzipped against the ~60 KB target in
  `docs/PROJECT.md` §1. About 67 KB of that is the Vue + Nuxt + router runtime
  floor, so the budget is not reachable while the site hydrates as a Nuxt app.
  Hitting it means prerendering to HTML and replacing hydration with a small
  vanilla-JS island for the shortcuts, theme toggle, and filter. That is an
  architectural decision, so it is flagged here rather than made unilaterally.
  Note this does not currently cost anything measurable: Lighthouse Performance
  is 100 and LCP is ~445 ms, because all content is in the prerendered HTML and
  the JS only hydrates behaviour.
- **Commit Mono is not bundled.** See `public/fonts/README.md`. The fallback
  monospace stack is used until the woff2 files are added.
- **`/og.png` is not generated.** Referenced by the Open Graph tags; should be a
  rendered screenshot of the fastfetch view (`docs/PROJECT.md` §8).
- **Open content questions** from `docs/PROJECT.md` §10 are unanswered and
  marked `TODO(andrew)` in the data.

## Frame technique

The chrome is one continuous frame with the tab bar inset in its top border and
the status line inset in its bottom border. The border is a pseudo-element inset
by half a row, and the bars that cross it carry the surface background so they
mask the line behind them — see `.frame` in `app/assets/css/base.css`.

The technique is ported from [WebTUI](https://webtui.ironclad.sh)'s
`box-="square" shear-="both"` (MIT). It is **not** a dependency: WebTUI is at
v0.1.10, its theme model (`--background0..3` / `--foreground0..2`) does not map
onto the semantic tokens in `docs/PROJECT.md` §5, and its `@layer base/components`
names collide with Tailwind v4's. This was the one utility worth having, and it
is ~20 lines. Worth revisiting if WebTUI reaches 1.0 or we want more of it.

## Palette note

The light-theme values in `docs/PROJECT.md` §5 (`--muted #5E6474`,
`--accent #A5670A`, `--link #1F7A6F`) fail WCAG AA against `--surface`
(3.4–4.4:1). Per the spec's own instruction to verify and adjust, they were
darkened to `#5B6170`, `#885508`, and `#1B6C62`, which clear 4.5:1 on both
`--bg` and `--surface`. Decorative glyphs use `--muted` rather than `--line`:
they are still visible text, so axe holds them to the same contrast bar.

## Analytics

Off unless `NUXT_PUBLIC_GTM_ID` is set. Events are declared in
`app/utils/analytics.ts` and sent through `track()`; the container loads after
idle so it never blocks rendering.

## Deploying

Static output goes to `.output/public` and can be hosted anywhere.
`public/_redirects` covers Cloudflare Pages; `routeRules` in `nuxt.config.ts`
covers dev and preview. Keep the two in sync.
