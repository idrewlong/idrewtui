/**
 * Shared content interfaces. Every fact rendered on the site is typed here and
 * supplied from `app/data/*`. Components never hardcode names, dates, employers
 * or links — see CLAUDE.md "Content rules".
 */

/** A link that leaves the site. */
export interface ExternalLink {
  label: string
  href: string
}

/** Availability flag. Opt-in: `hidden` renders no line at all. */
export type ProfileStatus = 'hidden' | 'Open to conversations' | 'Open to work'

export interface ContactChannel {
  /** Row label in the contact list, e.g. "Email". */
  label: string
  /** Text shown on the right of the leader dots, e.g. "in/idrewlong". */
  value: string
  href: string
  /** Analytics `contact_click` param. */
  channel: 'email' | 'linkedin' | 'github'
  /** Email rows get a copy-to-clipboard affordance. */
  copyable?: boolean
}

export interface Profile {
  name: string
  /** Shown as the fastfetch title, e.g. "andrew@idrewlong". */
  handle: string
  role: string
  employer: string
  location: string
  /** fastfetch key/value rows, in render order. */
  stack: string[]
  infra: string[]
  focus: string[]
  hobbies: string[]
  about: string
  /** Opt-in. `hidden` means the row is not rendered. */
  status: ProfileStatus
  /** Opt-in. `null` means the row is not rendered. */
  workAuthorization: string | null
  contact: ContactChannel[]
  resumeUrl: string
}

export interface ExperienceEntry {
  /** Stable id, also used as the `<details>` anchor. */
  slug: string
  title: string
  employer: string
  /** ISO `YYYY-MM`. */
  start: string
  /** ISO `YYYY-MM`, or null for the current role. */
  end: string | null
  /** Max two. Lead with outcomes. */
  bullets: string[]
  /** Expanded by default in the git-log view. */
  featured: boolean
}

export type ProjectCategory = 'client' | 'oss' | 'writing'

export interface Project {
  slug: string
  /** Rendered as the "filename", e.g. "madg.com" or "shrinkr". */
  name: string
  category: ProjectCategory
  /** One line, shown on the row. */
  summary: string
  href: string | null
  tags: string[]
  /** Inline detail panel. Omit fields that aren't known yet. */
  detail?: {
    role?: string
    stack?: string[]
    challenge?: string
    outcome?: string
  }
  /** `writing` rows show a date instead of tags. ISO `YYYY-MM-DD`. */
  published?: string
}

export interface SkillGroup {
  label: string
  items: string[]
}

export type CertStatus = 'earned' | 'in-progress'

export interface Certification {
  name: string
  status: CertStatus
  /** Credential URL, once earned. */
  href: string | null
}

export interface EducationEntry {
  institution: string
  credential: string
  honors: string[]
}
