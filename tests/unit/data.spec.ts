import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { experience } from '../../app/data/experience'
import { profile } from '../../app/data/profile'
import { projects } from '../../app/data/projects'
import { certifications, education, skillGroups } from '../../app/data/skills'
import { tabs } from '../../app/data/navigation'
import { writing } from '../../app/data/writing'

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

describe('profile', () => {
  it('keeps the opt-in fields off unless data turns them on', () => {
    // These are deliberate defaults, not oversights (docs/PROJECT.md §6).
    expect(['hidden', 'Open to conversations', 'Open to work']).toContain(profile.status)
    expect(profile.workAuthorization === null || typeof profile.workAuthorization === 'string').toBe(true)
  })

  it('exposes exactly the three documented contact channels', () => {
    expect(profile.contact.map(c => c.channel)).toEqual(['email', 'linkedin', 'github'])
  })

  it('only marks the email row copyable', () => {
    const copyable = profile.contact.filter(c => c.copyable)
    expect(copyable).toHaveLength(1)
    expect(copyable[0]!.channel).toBe('email')
  })

  it('uses absolute https links off-site and a mailto for email', () => {
    for (const channel of profile.contact) {
      if (channel.channel === 'email') expect(channel.href.startsWith('mailto:')).toBe(true)
      else expect(channel.href.startsWith('https://')).toBe(true)
    }
  })

  it('carries no personal attributes beyond recruiter-relevant fields', () => {
    // Guards docs/PROJECT.md §2: no age, height, religion, politics, family.
    const banned = ['age', 'height', 'religion', 'politics', 'family', 'maritalStatus']
    for (const key of banned) expect(Object.keys(profile)).not.toContain(key)
  })
})

describe('experience', () => {
  it('uses ISO YYYY-MM dates, with null only for the current role', () => {
    for (const role of experience) {
      expect(role.start, role.slug).toMatch(MONTH)
      if (role.end !== null) expect(role.end, role.slug).toMatch(MONTH)
    }
    expect(experience.filter(r => r.end === null)).toHaveLength(1)
  })

  it('is ordered newest first', () => {
    const starts = experience.map(r => r.start)
    expect([...starts].sort().reverse()).toEqual(starts)
  })

  it('never ends before it starts', () => {
    for (const role of experience) {
      if (role.end) expect(role.end >= role.start, role.slug).toBe(true)
    }
  })

  it('keeps at most two bullets per role', () => {
    for (const role of experience) {
      expect(role.bullets.length, role.slug).toBeLessThanOrEqual(2)
    }
  })

  it('has unique slugs', () => {
    expect(new Set(experience.map(r => r.slug)).size).toBe(experience.length)
  })

  it('expands exactly the two most recent roles by default', () => {
    expect(experience.filter(r => r.featured)).toHaveLength(2)
    expect(experience.slice(0, 2).every(r => r.featured)).toBe(true)
  })
})

describe('projects', () => {
  it('has unique slugs', () => {
    expect(new Set(projects.map(p => p.slug)).size).toBe(projects.length)
  })

  it('uses https links or null, never a bare or http URL', () => {
    for (const project of projects) {
      if (project.href !== null) expect(project.href.startsWith('https://'), project.slug).toBe(true)
    }
  })

  it('dates every writing entry and no others', () => {
    for (const project of projects) {
      if (project.category === 'writing') expect(project.published, project.slug).toMatch(DATE)
      else expect(project.published, project.slug).toBeUndefined()
    }
  })

  it('orders writing newest first', () => {
    const dates = writing.map(w => w.published!)
    expect([...dates].sort().reverse()).toEqual(dates)
  })
})

describe('skills', () => {
  it('lists no empty groups and no duplicate items', () => {
    for (const group of skillGroups) {
      expect(group.items.length, group.label).toBeGreaterThan(0)
      expect(new Set(group.items).size, group.label).toBe(group.items.length)
    }
  })

  it('has a design group with exactly Figma and Adobe Creative Suite', () => {
    const design = skillGroups.find(g => g.label === 'design')
    expect(design?.items).toEqual(['Figma', 'Adobe Creative Suite'])
  })

  it('lists Git under infra and VSCode under tools', () => {
    const infra = skillGroups.find(g => g.label === 'infra')
    const tools = skillGroups.find(g => g.label === 'tools')
    expect(infra?.items).toContain('Git')
    expect(tools?.items).toContain('VSCode')
  })

  it('only links certifications that are actually earned', () => {
    // Nothing is presented as credentialed until the data says so.
    for (const cert of certifications) {
      if (cert.status === 'in-progress') expect(cert.href, cert.name).toBeNull()
    }
  })

  it('records education without inventing honors', () => {
    for (const entry of education) {
      expect(entry.institution.length).toBeGreaterThan(0)
      expect(entry.credential.length).toBeGreaterThan(0)
      expect(Array.isArray(entry.honors)).toBe(true)
    }
  })

  it('credits the Lens Collective Program and Hall of Fame honours', () => {
    const oleMiss = education.find(e => e.institution === 'University of Mississippi')
    const delta = education.find(e => e.institution === 'Mississippi Delta Community College')
    expect(oleMiss?.honors).toContain('Lens Collective Program')
    expect(delta?.honors).toContain('Hall of Fame')
  })
})

describe('navigation', () => {
  it('matches the four routes in docs/PROJECT.md §3', () => {
    expect(tabs.map(t => t.to)).toEqual(['/', '/experience', '/projects', '/skills'])
    expect(tabs.map(t => t.key)).toEqual(['1', '2', '3', '4'])
  })

  it('gives every tab a path and a command for the prompt line', () => {
    for (const tab of tabs) {
      expect(tab.path.length).toBeGreaterThan(0)
      expect(tab.command.length).toBeGreaterThan(0)
    }
  })
})

describe('public/resume.pdf', () => {
  it('is a real PDF at the canonical path every view links to', () => {
    const path = join(process.cwd(), 'public/resume.pdf')
    expect(existsSync(path), 'public/resume.pdf is missing').toBe(true)
    expect(readFileSync(path).subarray(0, 5).toString('ascii')).toBe('%PDF-')
  })
})
