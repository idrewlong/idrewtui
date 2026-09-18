import { describe, expect, it } from 'vitest'
import { formatManPage, formatResume, formatResumeText } from '../../app/utils/resume'
import { profile } from '../../app/data/profile'
import { experience } from '../../app/data/experience'
import { certifications } from '../../app/data/skills'

describe('formatManPage', () => {
  const man = formatManPage()

  it('is a recruiter cheat sheet from existing profile data', () => {
    expect(man.name).toBe(profile.name)
    expect(man.role).toBe(profile.role)
    expect(man.employer).toBe(profile.employer)
    expect(man.location).toBe(profile.location)
    expect(man.stack).toEqual(profile.stack)
    expect(man.contact).toEqual(profile.contact)
    expect(man.resumeUrl).toBe(profile.resumeUrl)
  })

  it('labels in-progress certs and does not invent earned ones', () => {
    const inProgress = certifications.filter(c => c.status === 'in-progress')
    for (const cert of inProgress) {
      expect(man.certs.some(line => line.includes(cert.name) && line.includes('in progress'))).toBe(true)
    }
    const earned = certifications.filter(c => c.status === 'earned')
    for (const cert of earned) {
      const line = man.certs.find(l => l.includes(cert.name))
      expect(line).toBeTruthy()
      expect(line).not.toMatch(/in progress/i)
    }
  })
})

describe('formatResume', () => {
  const resume = formatResume()

  it('repeats profile facts rather than inventing a bio', () => {
    expect(resume.name).toBe(profile.name)
    expect(resume.about).toBe(profile.about)
    expect(resume.experience).toHaveLength(experience.length)
  })

  it('omits empty bullets instead of emitting placeholders', () => {
    for (const role of resume.experience) {
      expect(role.bullets.every(b => b.trim().length > 0)).toBe(true)
      expect(role.bullets.join(' ')).not.toMatch(/TODO/i)
    }
  })

  it('omits project rows that have no summary and no href', () => {
    for (const project of resume.projects) {
      expect(project.summary || project.href).toBeTruthy()
    }
  })
})

describe('formatResumeText', () => {
  const text = formatResumeText('https://idrewlong.com')
  const resume = formatResume()

  it('is a plaintext resume of the same facts as formatResume', () => {
    expect(text).toContain(resume.name)
    expect(text).toContain(resume.headline)
    expect(text).toContain(resume.about)
    expect(text).toContain(resume.location)
    expect(text).toContain('https://idrewlong.com/resume.pdf')
    expect(text).not.toMatch(/<[^>]+>/)
  })

  it('labels in-progress certs and drops empty or TODO copy', () => {
    expect(text).toMatch(/in progress/i)
    expect(text).not.toMatch(/TODO/i)
    for (const role of resume.experience) {
      for (const bullet of role.bullets) expect(text).toContain(bullet)
    }
  })
})
