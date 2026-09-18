import { profile } from '~/data/profile'
import type { ExperienceEntry, Project } from '~/types/content'

export interface RecruiterCardInput {
  siteUrl: string
  project?: Project
  role?: ExperienceEntry
}

export function formatRecruiterCard({ siteUrl, project, role }: RecruiterCardInput): string {
  const email = profile.contact.find(c => c.channel === 'email')
  const linkedin = profile.contact.find(c => c.channel === 'linkedin')
  const github = profile.contact.find(c => c.channel === 'github')
  const resume = `${siteUrl.replace(/\/$/, '')}${profile.resumeUrl}`

  const lines = [
    profile.name,
    `${profile.role} · ${profile.employer}`,
    profile.location,
    '',
    profile.stack.join(' · '),
    '',
  ]

  if (email) lines.push(`Email: ${email.value}`)
  if (linkedin) lines.push(`LinkedIn: ${linkedin.href}`)
  if (github) lines.push(`GitHub: ${github.href}`)
  lines.push(`Resume: ${resume}`)

  if (project) {
    lines.push('', `## ${project.name}`)
    if (project.summary.trim()) lines.push(project.summary)
    if (project.href) lines.push(project.href)
  }
  else if (role) {
    lines.push('', `## ${role.title}`)
    lines.push(role.employer)
    const bullet = role.bullets.find(b => b.trim())
    if (bullet) lines.push(bullet)
  }

  return lines.join('\n')
}
