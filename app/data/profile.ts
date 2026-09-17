import type { Profile } from '~/types/content'

/**
 * Facts here come from the current idrewlong.com and Andrew's resume.
 * Nothing is invented — open items are marked TODO(andrew) rather than guessed.
 */
export const profile: Profile = {
  name: 'Andrew Long',
  handle: 'andrew@idrewlong',
  role: 'Senior Full Stack Developer',
  employer: 'Mad Genius',
  location: 'Long Beach, MS',
  /** Fallback for the weather panel when geolocation is unavailable. */
  coords: { lat: 30.35, lon: -89.15 },

  stack: ['TypeScript', 'Vue/Nuxt', 'React', 'Laravel', 'Go'],
  infra: ['AWS', 'DigitalOcean', 'WP Engine', 'Docker'],
  focus: ['Headless CMS', 'analytics infra', 'DevSecOps'],
  hobbies: ['photography', 'drones'],

  about:
    'Full stack developer at Mad Genius, building headless WordPress + Nuxt sites, '
    + 'Laravel apps, and the analytics plumbing behind them. I translate technical '
    + 'problems into plain direction for non-technical teams, and I am working toward '
    + 'Security+ and AWS certifications on the way to cloud and DevSecOps work.',

  // Opt-in, off by default: the site is public and the current employer can see it.
  // docs/PROJECT.md §6. TODO(andrew): decide on/off at launch.
  status: 'hidden',

  // Opt-in, off by default. Only enable if it helps for defense/government roles.
  // TODO(andrew): decide on/off at launch (e.g. 'U.S. citizen').
  workAuthorization: null,

  contact: [
    {
      label: 'Email',
      // TODO(andrew): keep gmail, or set up hi@idrewlong.com? (docs/PROJECT.md §10)
      value: 'idrewlong@gmail.com',
      href: 'mailto:idrewlong@gmail.com',
      channel: 'email',
      copyable: true,
    },
    {
      label: 'LinkedIn',
      value: 'in/idrewlong',
      href: 'https://www.linkedin.com/in/idrewlong',
      channel: 'linkedin',
    },
    {
      label: 'GitHub',
      value: 'github.com/idrewlong',
      href: 'https://github.com/idrewlong',
      channel: 'github',
    },
  ],

  resumeUrl: '/resume.pdf',
}
