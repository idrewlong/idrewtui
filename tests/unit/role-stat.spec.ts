import { describe, expect, it } from 'vitest'
import { experience } from '../../app/data/experience'
import { roleStat } from '../../app/utils/role-stat'

describe('roleStat', () => {
  it('pulls named stack tokens from existing bullets, longest match first', () => {
    const senior = experience.find(r => r.slug === 'mad-genius-senior')!
    expect(roleStat(senior).stack).toEqual(['Nuxt', 'React', 'React Native', 'Laravel'])
  })

  it('uses the first real bullet as the outcome line', () => {
    const senior = experience.find(r => r.slug === 'mad-genius-senior')!
    expect(roleStat(senior).outcome).toBe(senior.bullets[0])
  })

  it('does not invent a stack or outcome when bullets are empty', () => {
    const thompson = experience.find(r => r.slug === 'thompson-machinery')!
    expect(roleStat(thompson)).toEqual({ stack: [], outcome: null })
  })

  it('does not invent technologies the bullets never name', () => {
    const corelogic = experience.find(r => r.slug === 'corelogic')!
    expect(roleStat(corelogic).stack).toEqual([])
    expect(roleStat(corelogic).outcome).toContain('CSAT')
  })
})
