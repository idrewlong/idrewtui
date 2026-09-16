import type { ExperienceEntry } from '~/types/content'

/**
 * Newest first — the git-log view renders them in this order.
 * Max two bullets per role, leading with outcomes (CLAUDE.md "Content rules").
 */
export const experience: ExperienceEntry[] = [
  {
    slug: 'mad-genius-senior',
    title: 'Senior Full Stack Developer',
    employer: 'Mad Genius',
    start: '2026-05',
    end: null,
    bullets: [
      'Lead full-stack architecture across the client portfolio (Nuxt, React, React Native, Laravel).',
      'Mentor junior developers and set front-end conventions across projects.',
    ],
    featured: true,
  },
  {
    slug: 'mad-genius-seo',
    title: 'SEO Developer',
    employer: 'Mad Genius',
    start: '2024-06',
    end: '2026-05',
    bullets: [
      'Lifted organic traffic 40% across 15+ clients through technical SEO and analytics audits.',
      'Built headless WordPress + Nuxt sites, React Native apps, and Laravel back ends for construction, real estate, and public health clients.',
    ],
    featured: true,
  },
  {
    slug: 'thompson-machinery',
    title: 'Marketing Project Manager',
    employer: 'Thompson Machinery',
    start: '2023-12',
    end: '2024-06',
    // TODO(andrew): confirm outcome bullets for this role from the resume.
    bullets: [],
    featured: false,
  },
  {
    slug: 'finders-guide',
    title: 'Web Developer (Founder)',
    employer: "Finder's Guide",
    start: '2022-09',
    end: '2024-05',
    // TODO(andrew): confirm outcome bullets for this role from the resume.
    bullets: [],
    featured: false,
  },
  {
    slug: 'corelogic',
    title: 'Customer Support Specialist',
    employer: 'CoreLogic',
    start: '2022-03',
    end: '2023-01',
    bullets: [
      'Held 95% CSAT across 50–70 customer interactions per day.',
    ],
    featured: false,
  },
  {
    slug: 'lmc',
    title: 'Owner / Director',
    employer: 'LMC',
    start: '2018-01',
    end: '2020-12',
    bullets: [
      'Directed and delivered 100+ music videos in two years.',
    ],
    featured: false,
  },
]
