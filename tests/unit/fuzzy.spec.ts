import { describe, expect, it } from 'vitest'
import { fuzzyScore, rank } from '../../app/utils/fuzzy'

describe('fuzzyScore', () => {
  it('returns 0 for an empty query so every item stays in play', () => {
    expect(fuzzyScore('', 'anything')).toBe(0)
    expect(fuzzyScore('   ', 'anything')).toBe(0)
  })

  it('scores a case-insensitive substring higher when it occurs earlier', () => {
    const early = fuzzyScore('mad', 'madg.com')
    const late = fuzzyScore('mad', 'whoami mad genius')
    expect(early).toBeGreaterThan(0)
    expect(late).toBeGreaterThan(0)
    expect(early).toBeGreaterThan(late)
  })

  it('matches a subsequence that is not a substring', () => {
    expect(fuzzyScore('mg', 'madg.com')).toBeGreaterThan(0)
  })

  it('returns null when a character is missing', () => {
    expect(fuzzyScore('xyz', 'madg.com')).toBeNull()
  })
})

describe('rank', () => {
  const items = [
    { id: 'a', haystack: 'info tab home' },
    { id: 'b', haystack: 'experience git log' },
    { id: 'c', haystack: 'projects madg.com' },
  ]

  it('keeps catalog order when the query is empty', () => {
    expect(rank(items, '').map(i => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('drops non-matches and sorts remaining by score descending', () => {
    expect(rank(items, 'mad').map(i => i.id)).toEqual(['c'])
    expect(rank(items, 'g').map(i => i.id).length).toBeGreaterThan(0)
  })
})
