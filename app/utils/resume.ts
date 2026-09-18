import { profile } from '~/data/profile'
import { experience } from '~/data/experience'
import { projects } from '~/data/projects'
import { certifications, education, skillGroups } from '~/data/skills'
import { formatRange } from '~/utils/format'
import type { ContactChannel } from '~/types/content'

export interface ManPage {
  name: string
  role: string
  employer: string
  location: string
  stack: string[]
  certs: string[]
  contact: ContactChannel[]
  resumeUrl: string
}

export function formatManPage(): ManPage {
  return {
    name: profile.name,
    role: profile.role,
    employer: profile.employer,
    location: profile.location,
    stack: profile.stack,
    certs: certifications.map(c => (
      c.status === 'in-progress' ? `${c.name} (in progress)` : c.name
    )),
    contact: profile.contact,
    resumeUrl: profile.resumeUrl,
  }
}

export interface ResumeRole {
  title: string
  employer: string
  dates: string
  bullets: string[]
}

export interface ResumeProject {
  name: string
  summary: string
  href: string | null
}

export interface ResumeDoc {
  name: string
  headline: string
  location: string
  about: string
  contact: ContactChannel[]
  resumeUrl: string
  experience: ResumeRole[]
  skills: { label: string, items: string[] }[]
  certs: string[]
  education: { institution: string, credential: string, honors: string[] }[]
  projects: ResumeProject[]
}

export function formatResume(): ResumeDoc {
  return {
    name: profile.name,
    headline: `${profile.role} · ${profile.employer}`,
    location: profile.location,
    about: profile.about,
    contact: profile.contact,
    resumeUrl: profile.resumeUrl,
    experience: experience.map(role => ({
      title: role.title,
      employer: role.employer,
      dates: formatRange(role.start, role.end),
      bullets: role.bullets.filter(b => b.trim().length > 0 && !/TODO/i.test(b)),
    })),
    skills: skillGroups,
    certs: certifications.map(c => (
      c.status === 'in-progress' ? `${c.name} (in progress)` : c.name
    )),
    education: education,
    projects: projects
      .filter(p => p.summary.trim() || p.href)
      .map(p => ({ name: p.name, summary: p.summary, href: p.href })),
  }
}

/** Plaintext resume for `curl https://idrewlong.com/resume.txt`. */
export function formatResumeText(siteUrl: string): string {
  const resume = formatResume()
  const base = siteUrl.replace(/\/$/, '')
  const lines: string[] = [
    resume.name,
    resume.headline,
    resume.location,
    '',
    resume.about,
    '',
    'CONTACT',
  ]

  for (const channel of resume.contact) {
    lines.push(`${channel.label}: ${channel.value}`)
    lines.push(channel.href)
  }

  lines.push('', 'EXPERIENCE', '')
  for (const role of resume.experience) {
    lines.push(`${role.title} · ${role.employer}`)
    lines.push(role.dates)
    for (const bullet of role.bullets) {
      lines.push(`- ${bullet}`)
    }
    lines.push('')
  }

  lines.push('SKILLS')
  for (const group of resume.skills) {
    lines.push(`${group.label}: ${group.items.join(', ')}`)
  }

  lines.push('', 'CERTIFICATIONS')
  for (const cert of resume.certs) {
    lines.push(`- ${cert}`)
  }

  lines.push('', 'EDUCATION')
  for (const entry of resume.education) {
    lines.push(`${entry.institution} — ${entry.credential}`)
    if (entry.honors.length) {
      lines.push(entry.honors.join(' · '))
    }
    lines.push('')
  }

  lines.push('PROJECTS')
  for (const project of resume.projects) {
    lines.push(project.name)
    if (project.summary) lines.push(project.summary)
    if (project.href) lines.push(project.href)
    lines.push('')
  }

  lines.push(`Resume PDF: ${base}${resume.resumeUrl}`)
  return `${lines.join('\n').trim()}\n`
}

/** Landing plaintext so `curl …/index.txt` is useful without UA-sniffing `/`. */
export function formatCurlIndex(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '')
  return `idrewlong.com\nPlaintext resume. curl ${base}/resume.txt\n\n${formatResumeText(siteUrl)}`
}
