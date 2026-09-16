import type { Certification, EducationEntry, SkillGroup } from '~/types/content'

/** Plain text, ATS- and LLM-friendly. No levels, bars, or percentages. */
export const skillGroups: SkillGroup[] = [
  {
    label: 'languages',
    items: ['TypeScript', 'JavaScript', 'Go', 'PHP', 'Python', 'SQL'],
  },
  {
    label: 'frontend',
    items: ['Vue/Nuxt', 'React/Next', 'Svelte/SvelteKit', 'Tailwind', 'GSAP', 'WordPress'],
  },
  {
    label: 'backend',
    items: ['Laravel', 'Node.js', 'GraphQL', 'PostgreSQL', 'Redis'],
  },
  {
    label: 'infra',
    items: ['AWS', 'DigitalOcean', 'WP Engine', 'Cloudflare', 'Docker', 'CI/CD'],
  },
  {
    label: 'analytics',
    items: ['GTM', 'GA4', 'Search Console', 'SEMrush'],
  },
  {
    label: 'tools',
    items: ['Claude Code', 'Cursor', 'Postman', 'Jira', 'Salesforce', 'Twilio'],
  },
]

/**
 * Nothing is marked earned until the data says so. When a cert is earned,
 * flip `status` to 'earned' and add the credential `href`.
 */
export const certifications: Certification[] = [
  { name: 'CompTIA Security+ (SY0-701)', status: 'in-progress', href: null },
  { name: 'AWS Solutions Architect – Associate', status: 'in-progress', href: null },
  { name: 'FAA Part 107 Remote Pilot', status: 'earned', href: null },
]

export const education: EducationEntry[] = [
  {
    institution: 'University of Mississippi',
    // TODO(andrew): the live site says B.A. in General Studies; journalism /
    // photojournalism is also part of the background. Which should this state?
    // (docs/PROJECT.md §10)
    credential: 'B.A.',
    honors: ['Lyceum Scholar', "Chancellor's Leadership Class"],
  },
  {
    institution: 'Mississippi Delta Community College',
    credential: 'A.A. Pre-Engineering',
    honors: ['Phi Theta Kappa President', 'NASA Scholar'],
  },
]
