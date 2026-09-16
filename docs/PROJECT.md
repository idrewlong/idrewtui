# PROJECT.md — idrewlong.com v2 (TUI portfolio)

## 1. What we're building

A rebuild of idrewlong.com as a terminal-UI (TUI) styled portfolio. It should feel like a
well-configured terminal session (tabs, a `fastfetch`-style summary, keyboard shortcuts)
while being a normal, fast, accessible, crawlable static website underneath.

The current site is a long single page with nine sections, a marquee, a process carousel,
and duplicated mobile/desktop markup. v2 cuts that down to what a recruiter needs, arranged
so the important facts are visible in the first screen.

### Primary audience
Technical recruiters and hiring managers, including defense/government-adjacent employers
(Eglin / Fort Walton Beach corridor, Huntsville AL). They skim on laptops and phones, often
for under a minute, and mostly want: current role, stack, experience, certifications,
proof of work, resume, and a way to make contact.

### Secondary audience
Engineers who click through from GitHub and appreciate the terminal aesthetic.

### Success criteria
- Name, role, location, core stack, certifications, and a resume link are visible without
  scrolling on a 1366×768 laptop and within one scroll on a phone.
- A recruiter who never touches the keyboard can reach everything with clicks/taps.
- Resume PDF reachable in one click from every view.
- Lighthouse: Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100.
- Total JS shipped for first view under ~60 KB gzipped. No layout shift.
- Works with JavaScript disabled (content present in HTML; only keyboard nav degrades).

### Non-goals
- A real shell or command parser as the main navigation. (An optional `:` command
  palette is a stretch goal, never the only way in.)
- Typing animations that delay content.
- A blog engine. Articles link out to where they're published.

---

## 2. Reference and direction

Reference: the ironclad.sh screenshot — tab bar with numbered tabs, bordered pane,
`fastfetch` block with ASCII art beside key/value lines, section dividers titled inline
(`──── About Me ────`), dotted-leader contact rows, two buttons at the bottom.

What we keep: numbered tabs, single bordered pane, fastfetch layout, inline-titled rules,
leader-dot rows, always-visible "View Resume".

What we change:
- **Fields are recruiter fields.** No age, religion, height, or similar personal
  attributes. They don't help a hiring decision and can create problems for employers
  screening candidates.
- **Own palette.** Not the lime-on-slate look of the reference (see §5).
- **Own ASCII art.** A mark tied to Andrew's world (top-down drone or small aircraft,
  a film camera, or the iDrew logo rendered in block characters) — not a robot.

---

## 3. Information architecture

Four tabs. Each is a real route so it can be linked, indexed, and opened in a new tab.

| Key | Tab        | Route         | Terminal metaphor          | Purpose                          |
|-----|------------|---------------|----------------------------|----------------------------------|
| 1   | info       | `/`           | `fastfetch`                | 10-second summary + contact      |
| 2   | experience | `/experience` | `git log --oneline --graph`| Work history                     |
| 3   | projects   | `/projects`   | `ls -la ~/projects`        | Client work + open source        |
| 4   | skills     | `/skills`     | `tree ~/skills`            | Stack, certs, education          |

Persistent chrome on every view:
- Tab bar (top): `[1] info  [2] experience  [3] projects  [4] skills` · right side:
  `resume ↗`
- Status line (bottom), like a tmux/vim status bar:
  `NORMAL │ ~/experience │ 1-4 switch · j/k scroll · ? help │ Long Beach, MS`
- On mobile the status line collapses to the path + a `?` button.

`/contact` from the old site redirects (301) to `/#contact`.
`/Andrew Long Resume.pdf` stays reachable; also add `/resume.pdf` as the canonical path.

---

## 4. Screen specs

Wireframes are approximate; widths assume the pane max width of ~88ch.

### 4.1 `/` — info

```
┌ [1] info  [2] experience  [3] projects  [4] skills ──────────── resume ↗ ┐
│ guest@idrewlong.com:~$ fastfetch                                         │
│                                                                          │
│   ░░ ascii ░░      andrew@idrewlong                                      │
│   ░░  art  ░░      ────────────────                                      │
│   ░░       ░░      Role      Senior Full Stack Developer @ Mad Genius    │
│   ░░       ░░      Location  Long Beach, MS                              │
│   ░░       ░░      Stack     TypeScript · Vue/Nuxt · React · Laravel · Go│
│   ░░       ░░      Infra     AWS · DigitalOcean · WP Engine · Docker     │
│   ░░       ░░      Certs     Security+ (in progress) · AWS SAA (in prog.)│
│                              FAA Part 107 Remote Pilot                   │
│                    Focus     Headless CMS · analytics infra · DevSecOps  │
│                    Status    <configurable, see §6>                      │
│                                                                          │
│ ─────────────────────────────── about ────────────────────────────────── │
│  2–3 sentence summary (see §6)                                           │
│                                                                          │
│ ─────────────────────────────── contact ──────────────────────────────── │
│  Email     ······························ idrewlong@gmail.com ↗          │
│  LinkedIn  ······························ in/idrewlong ↗                 │
│  GitHub    ······························ github.com/idrewlong ↗         │
│                                                                          │
│                          [ Download resume ]  [ See projects ]           │
└──────────────────────────────────────────────────────────────────────────┘
 NORMAL │ ~ │ 1-4 switch · ? help                              Long Beach, MS
```

- Below ~640px the ASCII art moves above the key/value list and scales down (or is
  replaced by a smaller variant). Keys stay left-aligned; values wrap under themselves.
- Email row has a copy-to-clipboard action (`y` key, or a small `copy` button) with a
  status-line confirmation: `yanked idrewlong@gmail.com`.

### 4.2 `/experience` — git log

```
guest@idrewlong.com:~$ git log --career

* 2026-05 ── present   Senior Full Stack Developer · Mad Genius
│  Lead full-stack architecture across client portfolio (Nuxt, React,
│  React Native, Laravel). Mentor junior devs.
│
* 2024-06 ── 2026-05   SEO Developer · Mad Genius
│  Headless WordPress + Nuxt, React Native, Laravel apps. SEO and
│  analytics audits for construction, real estate, public health clients.
│
* 2023-12 ── 2024-06   Marketing Project Manager · Thompson Machinery
* 2022-09 ── 2024-05   Web Developer (Founder) · Finder's Guide
* 2022-03 ── 2023-01   Customer Support Specialist · CoreLogic
* 2018-01 ── 2020-12   Owner / Director · LMC
```

- Most recent two roles expanded by default; older roles collapsed to one line and expand
  on click / Enter (`<details>` element — works without JS).
- Max 2 bullets per role. Lead with outcomes and numbers where they exist
  (40% organic traffic lift across 15+ clients; 95% CSAT at 50–70 interactions/day;
  100+ music videos in two years).
- Commit "hash" column is decorative and `aria-hidden`.

### 4.3 `/projects` — ls

```
guest@idrewlong.com:~$ ls -la ~/projects

drwxr-xr-x  client/
  madg.com                Agency site rebuild · GSAP transitions, SEO        ↗
  wgyates.com             National construction firm · modular templates     ↗
  regionalhomes.net       Home builder · lead-gen pages, 50+ sites          ↗
  eleyguildhardy.com      Architecture portfolio · image + transition perf   ↗
  lessleyaviation.com     Flight school · headless WordPress + Nuxt          ↗
drwxr-xr-x  oss/
  shrinkr                 Go CLI · <one-liner TODO>                          ↗
  morphr                  Go CLI · <one-liner TODO>                          ↗
  skill-mgr               Go · security scanner for AI agent skills          ↗
  snapr                   Chrome extension · screenshots                     ↗
-rw-r--r--  writing/
  When Tools Are Smart Enough, All That's Left Is Taste   2026-05-12        ↗
  The Modern Marketer's Guide to AI Implementation        2025-03-19        ↗
  SEO in the Age of AI Search Engines                     2025-01-07        ↗
```

- Filter row at top: `[all] [client] [oss] [writing]` (buttons; `f` cycles).
- Each row: name, one line, tags, external link. Selecting a row (Enter / click on the
  name) expands an inline detail panel: role, stack, what was hard, outcome, optional
  screenshot (lazy-loaded, dithered/duotone to match the theme, with real alt text).
- The old site hides 4 more projects behind "Show more" — pull those into data and decide
  which earn a row.

### 4.4 `/skills` — tree

```
guest@idrewlong.com:~$ tree ~/skills

skills
├── languages     TypeScript  JavaScript  Go  PHP  Python  SQL
├── frontend      Vue/Nuxt  React/Next  Svelte/SvelteKit  Tailwind  GSAP  WordPress
├── backend       Laravel  Node.js  GraphQL  PostgreSQL  Redis
├── infra         AWS  DigitalOcean  WP Engine  Cloudflare  Docker  CI/CD
├── analytics     GTM  GA4  Search Console  SEMrush
└── tools         Claude Code  Cursor  Postman  Jira  Salesforce  Twilio

certs
├── [~] CompTIA Security+ (SY0-701)      in progress
├── [~] AWS Solutions Architect – Assoc. in progress
└── [x] FAA Part 107 Remote Pilot        active

education
├── University of Mississippi — B.A.     Lyceum Scholar · Chancellor's Leadership Class
└── Mississippi Delta CC — A.A. Pre-Eng. Phi Theta Kappa President · NASA Scholar
```

- Plain text is searchable and ATS/LLM-friendly. No skill bars or percentages.
- When a cert is earned, flip `[~]` to `[x]` in data and add the credential link.

### 4.5 Help overlay (`?`)

Modal listing shortcuts, dismissed with `Esc` or `?`. Focus trapped while open,
restored on close.

### 4.6 404

`bash: /some-path: No such file or directory` followed by links to the four tabs.

---

## 5. Design system

The brief pins the direction (dark TUI). Within it, the palette borrows from the Gulf
Coast at night and amber-phosphor terminals instead of the usual green-on-black.

### Color tokens (dark, default)

| Token        | Hex       | Use                                   |
|--------------|-----------|---------------------------------------|
| `--bg`       | `#161B26` | Page background (blue-slate)          |
| `--surface`  | `#1E2433` | Pane, tab bar, status line            |
| `--line`     | `#323B52` | Borders, rules, leader dots           |
| `--fg`       | `#DCD7C9` | Body text (warm paper)                |
| `--muted`    | `#8C93A6` | Secondary text, descriptions          |
| `--accent`   | `#F2B544` | Keys in fastfetch, active tab, prompt |
| `--link`     | `#6CC0B4` | Links (Gulf teal)                     |
| `--danger`   | `#E0786D` | Errors, 404                           |

Light theme ("paper"): `--bg #EFEAE0`, `--surface #E4DED1`, `--line #C6BEAD`,
`--fg #1F2430`, `--muted #5E6474`, `--accent #A5670A`, `--link #1F7A6F`.
Theme follows `prefers-color-scheme`, with a manual toggle (`t`) persisted in
`localStorage`. The fastfetch `Theme` line can name it, like the reference does.

All text/background pairs must meet WCAG AA (4.5:1 body, 3:1 large/UI). Verify with a
contrast checker before shipping; adjust `--muted` first if anything fails.

### Type

- One family: **Commit Mono** (OFL, self-hosted woff2, `font-display: swap`).
  Fallback stack: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`.
- Scale (rem): 0.8125 status line · 0.9375 body · 1 prompt/headings · 1.25 name.
- Weight does the hierarchy work (400 body, 600 keys/headings). No all-caps labels.
- Line length capped at ~80ch inside the pane.

### Layout

- Single centered pane, `max-width: 88ch`, 1px `--line` border, square corners on the
  pane; buttons get a 2px radius so they read as controls.
- Box-drawing characters are rendered with CSS borders and pseudo-elements where
  possible, not literal glyphs, so they don't break on wrap. Literal glyphs only in
  decorative, `aria-hidden` spots (tree branches, git graph).
- Inline-titled rules: flex row `line · title · line`.
- Leader dots: flex row with a dotted `border-bottom` filler.

### Motion

One moment only: on first load, the prompt line types the command (≈300ms), then the
fastfetch block appears at once. Skipped entirely on `prefers-reduced-motion` and on
subsequent tab switches. A blinking block cursor sits after the prompt (static when
reduced motion is set).

---

## 6. Content

All content lives in typed data files (see CLAUDE.md). Source of truth is the current
site + resume; nothing is invented.

### About (draft — edit to taste)
> Full stack developer at Mad Genius, building headless WordPress + Nuxt sites,
> Laravel apps, and the analytics plumbing behind them. I translate technical problems
> into plain direction for non-technical teams, and I'm working toward Security+ and AWS
> certifications on the way to cloud and DevSecOps work.

### Status line (configurable)
`profile.status` in data, one of:
- `hidden` (default — the field isn't rendered)
- `Open to conversations`
- `Open to work`

Kept off by default since the site is public and the current employer can see it.

### Optional field
`profile.workAuthorization` (e.g. "U.S. citizen") — off by default. Only turn on if it
helps for defense/government roles.

### Dropped from the old site
Process carousel, logo marquee (twice), duplicated mobile/desktop blocks, hero tagline
"I like to build amazing", and the "Currently / Hobbies" block. The personal touches that
stay are optional and short (e.g. a `Hobbies` fastfetch line: photography, drones).

---

## 7. Interaction model

| Key        | Action                                  |
|------------|-----------------------------------------|
| `1`–`4`    | Switch tab                              |
| `h` / `l`  | Previous / next tab                     |
| `j` / `k`  | Move selection down / up in lists       |
| `Enter`    | Open / expand selected row              |
| `g` / `G`  | Jump to top / bottom                    |
| `f`        | Cycle project filter                    |
| `r`        | Open resume PDF                         |
| `y`        | Copy email                              |
| `t`        | Toggle theme                            |
| `?`        | Help overlay                            |
| `Esc`      | Close overlay / collapse                |

Rules:
- Shortcuts are ignored when focus is in an input or when a modifier key is held.
- Every shortcut has a visible, clickable equivalent.
- Tab order follows visual order; all interactive elements have a visible focus ring
  in `--accent`.
- Tab bar is a `<nav>` of links (not ARIA tabs), because each tab is a separate page.

---

## 8. Tech

- **Framework:** Nuxt (latest stable) with static generation (`nuxt generate`),
  TypeScript strict.
- **Styling:** Tailwind CSS v4 with tokens defined as CSS variables; small amount of
  scoped CSS for box-drawing details.
- **Content:** typed TS data modules in `app/data/`. No CMS.
- **Hosting:** Cloudflare Pages (or DigitalOcean App Platform). Redirects for `/contact`
  and the old resume path.
- **Analytics:** GA4 via GTM, loaded after consent / idle, with events:
  `resume_download`, `contact_click` (param: channel), `project_open` (param: slug),
  `tab_switch` (param: tab), `shortcut_used` (param: key). Or Cloudflare Web Analytics
  if a cookieless setup is preferred.
- **SEO:** per-route title/description, canonical, Open Graph image (a rendered
  screenshot of the fastfetch view), `Person` JSON-LD (name, jobTitle, worksFor, sameAs,
  address locality), sitemap.xml, robots.txt.
- **Testing:** Vitest for keyboard handler and data shape; Playwright smoke test for
  each route + axe accessibility scan; Lighthouse CI on PRs.

---

## 9. Milestones

1. **Scaffold** — Nuxt + Tailwind, tokens, font, layout shell (tab bar, pane, status line).
2. **Data** — port content from current site and resume into `app/data/`; resolve open
   questions below.
3. **Views** — info, experience, projects, skills, 404.
4. **Keyboard + help overlay** — composable, tests.
5. **Polish** — ASCII art, light theme, first-load motion, OG image.
6. **Ship** — SEO, analytics, redirects, Lighthouse/axe passing, deploy.

---

## 10. Open questions

- Education: the live site lists a B.A. in General Studies from Ole Miss; journalism /
  photojournalism is also part of the background. Which should the site state?
- "Uptime"/years-of-experience figure: pick one number and make sure it matches the resume.
- One-line descriptions and repo links for Shrinkr and Morphr.
- The four projects behind "Show more" on the current site — include or drop?
- Include MyLocalAudit (SaaS concept) or keep it private until it ships?
- ~~ASCII art subject: drone, aircraft, camera, or iDrew logo?~~ **Settled:** the
  iDrew logo, "iD" in block letters (`app/components/tui/AsciiArt.vue`).
- Status field and work-authorization field: on or off at launch?
- Keep idrewlong@gmail.com, or set up a domain address (e.g. hi@idrewlong.com)?
