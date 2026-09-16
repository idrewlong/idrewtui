# CLAUDE.md

Guidance for Claude Code in this repo. The full spec is in `docs/PROJECT.md` — read it before
starting any feature, and treat it as the source of truth for scope, layout, and content.

## Project in one paragraph

idrewlong.com v2: Andrew Long's portfolio, rebuilt as a terminal-UI styled static site
for recruiters. Four routes (`/`, `/experience`, `/projects`, `/skills`) presented as
numbered tabs, with a `fastfetch`-style summary, keyboard shortcuts, and a resume link on
every view. It must stay fast, accessible, and fully readable without a keyboard or JS.

## Stack

- Nuxt (latest stable), static output via `nuxt generate`, TypeScript `strict`
- Tailwind CSS v4; design tokens as CSS custom properties in `app/assets/css/tokens.css`
- Self-hosted Commit Mono font (`public/fonts/`)
- Vitest (unit), Playwright + @axe-core/playwright (e2e/a11y), Lighthouse CI
- pnpm

## Commands

```bash
pnpm install
pnpm dev            # local dev server
pnpm generate       # static build to .output/public
pnpm preview        # serve the static build
pnpm lint           # eslint
pnpm typecheck      # nuxi typecheck
pnpm test           # vitest
pnpm test:e2e       # playwright (includes axe scan on every route)
```

Before saying a task is done: `pnpm lint && pnpm typecheck && pnpm test` must pass.
For UI changes, also run `pnpm test:e2e`.

## Structure

```
app/
  assets/css/       tokens.css (colors, type scale), base.css (box-drawing helpers)
  components/
    tui/            Pane, TabBar, StatusLine, Rule, LeaderRow, Prompt, Cursor,
                    HelpOverlay, AsciiArt
    views/          Fastfetch, GitLog, ProjectList, SkillTree
  composables/      useKeybindings.ts, useTheme.ts, useClipboard.ts, useSelection.ts
  data/             profile.ts, experience.ts, projects.ts, skills.ts, writing.ts
  layouts/          default.vue (tab bar + pane + status line)
  pages/            index.vue, experience.vue, projects.vue, skills.vue, [...slug].vue (404)
  types/            content.ts (shared interfaces for data/)
public/
  resume.pdf
  fonts/
tests/
  unit/  e2e/
```

## Content rules

- All copy and facts live in `app/data/*.ts`, typed by `app/types/content.ts`.
  Components never hardcode names, dates, employers, or links.
- **Never invent facts.** Titles, dates, metrics, certifications, and project details come
  from the current site, the resume, or Andrew. If something is missing, leave a
  `// TODO(andrew): ...` and a visible placeholder in dev only — don't guess.
- Certifications in progress are labeled "in progress." Don't mark anything as earned
  until the data says so.
- Don't add personal attributes (age, religion, height, politics, family details, etc.)
  to the fastfetch block or anywhere else. Fields are recruiter-relevant only.
- `profile.status` and `profile.workAuthorization` are opt-in flags; when unset, the
  line isn't rendered at all.
- Copy style: plain, sentence case, active voice, no hype adjectives. Max two bullets per
  experience entry, leading with outcomes.

## TUI rules

- Semantic HTML first. The terminal look is CSS on top of real `nav`, `main`, `h1`–`h3`,
  `ul`, `dl`, `details`, `a`, `button`. Fastfetch key/values are a `<dl>`.
- Decorative glyphs (ASCII art, tree branches, git graph lines, fake hashes, prompt `$`)
  get `aria-hidden="true"`. The accessible text must make sense on its own.
- Prefer CSS borders/pseudo-elements for boxes and rules over literal box-drawing
  characters, so wrapping never breaks the frame.
- Each page has exactly one `h1` (visually it can be the prompt line; use a visually
  hidden `h1` if needed).
- Tab bar is a list of `NuxtLink`s with `aria-current="page"` — not ARIA tabs.
- No fake loading, no typing effects on anything except the single first-load prompt
  described in docs/PROJECT.md §5, and that must be skipped under `prefers-reduced-motion`.

## Keyboard

- All shortcuts are defined in one place: `useKeybindings.ts` (a map of key → action
  with a description, which also feeds `HelpOverlay`).
- Ignore key events when `event.target` is an input/textarea/contenteditable or when
  Ctrl/Meta/Alt is held. Never override browser or screen-reader shortcuts.
- Every shortcut needs a visible click/tap equivalent.
- Clean up listeners on unmount. Cover the handler with unit tests.

## Styling

- Use tokens only (`var(--accent)` etc., exposed to Tailwind via `@theme`). No raw hex in
  components.
- Dark theme is default; light "paper" theme via `[data-theme="light"]`. Respect
  `prefers-color-scheme` on first visit, then the stored choice.
- Contrast: AA minimum for every text/background pair in both themes.
- Focus ring: visible 2px `--accent` outline on every interactive element.
- Pane `max-width: 88ch`; body text capped around 80ch.
- Mobile first. Check at 360px, 768px, 1366px. ASCII art stacks above the fastfetch
  list below 640px.

## Performance and SEO

- Budget: < 60 KB gzipped JS on first view, zero CLS, LCP < 1.5s on mid-tier mobile.
- No client-only rendering for content. No large dependencies for things CSS can do.
- Images: lazy-load, explicit width/height, WebP/AVIF, meaningful `alt`.
- Every page sets title, description, canonical, and OG tags via `useSeoMeta`.
  `Person` JSON-LD on `/`. Keep sitemap and redirects (`/contact` → `/#contact`,
  old resume path → `/resume.pdf`) in sync when routes change.

## Analytics

Events are defined in `app/utils/analytics.ts` and called through a single `track()`
helper: `resume_download`, `contact_click`, `project_open`, `tab_switch`,
`shortcut_used`. Don't add new events without adding them there. Analytics must load
after idle and never block rendering.

## Working style

- Small, focused commits with conventional messages (`feat:`, `fix:`, `chore:`).
- When a change touches layout, describe what changed at mobile and desktop widths.
- If a request conflicts with docs/PROJECT.md, flag it and ask before proceeding.
- Don't add dependencies without saying why; prefer the platform.
