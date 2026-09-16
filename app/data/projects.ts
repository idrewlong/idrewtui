import type { Project } from '~/types/content'

/**
 * Client work and open source. Rows render in this order within each category.
 * Descriptions come from the current site; unknowns are TODO(andrew), not guesses.
 */
export const projects: Project[] = [
  // ── client ──────────────────────────────────────────────────────────────
  {
    slug: 'madg',
    name: 'madg.com',
    category: 'client',
    summary: 'Agency site rebuild with GSAP transitions and SEO work.',
    href: 'https://madg.com',
    tags: ['Nuxt', 'GSAP', 'SEO'],
  },
  {
    slug: 'wgyates',
    name: 'wgyates.com',
    category: 'client',
    summary: 'National construction firm site built on modular templates.',
    href: 'https://wgyates.com',
    tags: ['WordPress', 'Nuxt'],
  },
  {
    slug: 'regionalhomes',
    name: 'regionalhomes.net',
    category: 'client',
    summary: 'Home builder lead-generation pages across 50+ sites.',
    href: 'https://regionalhomes.net',
    tags: ['WordPress', 'Lead gen'],
  },
  {
    slug: 'eleyguildhardy',
    name: 'eleyguildhardy.com',
    category: 'client',
    summary: 'Architecture portfolio focused on image and transition performance.',
    href: 'https://eleyguildhardy.com',
    tags: ['Performance', 'GSAP'],
  },
  {
    slug: 'lessleyaviation',
    name: 'lessleyaviation.com',
    category: 'client',
    summary: 'Flight school site on headless WordPress + Nuxt.',
    href: 'https://lessleyaviation.com',
    tags: ['Headless WP', 'Nuxt'],
  },

  // ── oss ─────────────────────────────────────────────────────────────────
  {
    slug: 'shrinkr',
    name: 'shrinkr',
    category: 'oss',
    // TODO(andrew): one-line description + repo link (docs/PROJECT.md §10).
    summary: '',
    href: null,
    tags: ['Go', 'CLI'],
  },
  {
    slug: 'morphr',
    name: 'morphr',
    category: 'oss',
    // TODO(andrew): one-line description + repo link (docs/PROJECT.md §10).
    summary: '',
    href: null,
    tags: ['Go', 'CLI'],
  },
  {
    slug: 'skill-mgr',
    name: 'skill-mgr',
    category: 'oss',
    summary: 'Security scanner for AI agent skills.',
    // TODO(andrew): confirm public repo URL.
    href: null,
    tags: ['Go', 'Security'],
  },
  {
    slug: 'snapr',
    name: 'snapr',
    category: 'oss',
    summary: 'Chrome extension for screenshots.',
    // TODO(andrew): confirm listing / repo URL.
    href: null,
    tags: ['Chrome extension'],
  },

  // ── writing ─────────────────────────────────────────────────────────────
  {
    slug: 'taste',
    name: "When Tools Are Smart Enough, All That's Left Is Taste",
    category: 'writing',
    summary: '',
    // TODO(andrew): canonical published URL.
    href: null,
    tags: [],
    published: '2026-05-12',
  },
  {
    slug: 'ai-implementation',
    name: "The Modern Marketer's Guide to AI Implementation",
    category: 'writing',
    summary: '',
    // TODO(andrew): canonical published URL.
    href: null,
    tags: [],
    published: '2025-03-19',
  },
  {
    slug: 'seo-ai-search',
    name: 'SEO in the Age of AI Search Engines',
    category: 'writing',
    summary: '',
    // TODO(andrew): canonical published URL.
    href: null,
    tags: [],
    published: '2025-01-07',
  },

  // TODO(andrew): the four projects behind "Show more" on the current site —
  // decide which earn a row here (docs/PROJECT.md §10), plus whether to list
  // MyLocalAudit before it ships.
]
