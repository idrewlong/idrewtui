import { describe, expect, it } from 'vitest'
import { formatRecruiterCard } from '../../app/utils/recruiter-card'
import { profile } from '../../app/data/profile'
import { projects } from '../../app/data/projects'
import { experience } from '../../app/data/experience'

const SITE = 'https://idrewlong.com'

describe('formatRecruiterCard', () => {
  it('copies a markdown card from profile data only', () => {
    const card = formatRecruiterCard({ siteUrl: SITE })
    expect(card).toContain(profile.name)
    expect(card).toContain(profile.role)
    expect(card).toContain(profile.employer)
    expect(card).toContain(profile.location)
    expect(card).toContain(profile.stack.join(' · '))
    expect(card).toContain(profile.contact[0]!.value)
    expect(card).toContain(profile.contact[1]!.href)
    expect(card).toContain(profile.contact[2]!.href)
    expect(card).toContain(`${SITE}${profile.resumeUrl}`)
  })

  it('appends a project section only when that row has a name', () => {
    const project = projects.find(p => p.summary)!
    const card = formatRecruiterCard({ siteUrl: SITE, project })
    expect(card).toContain(`## ${project.name}`)
    expect(card).toContain(project.summary)
    if (project.href) expect(card).toContain(project.href)
  })

  it('omits empty project fields rather than inventing them', () => {
    const empty = projects.find(p => !p.summary && !p.href)
    expect(empty).toBeTruthy()
    const card = formatRecruiterCard({ siteUrl: SITE, project: empty })
    expect(card).toContain(`## ${empty!.name}`)
    expect(card).not.toMatch(/TODO/i)
    expect(card).not.toMatch(/description pending/i)
  })

  it('appends an experience section from title and employer', () => {
    const role = experience[0]!
    const card = formatRecruiterCard({ siteUrl: SITE, role })
    expect(card).toContain(`## ${role.title}`)
    expect(card).toContain(role.employer)
  })
})
