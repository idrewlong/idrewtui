import { describe, expect, it } from 'vitest'
import { oppositeTheme, parseStoredTheme, resolveTheme } from '../../app/composables/useTheme'
import { wrapIndex } from '../../app/composables/useSelection'
import { formatDate, formatMonth, formatRange, machineRange } from '../../app/utils/format'

describe('theme resolution', () => {
  it('prefers a stored choice over the OS setting', () => {
    expect(resolveTheme('light', false)).toBe('light')
    expect(resolveTheme('dark', true)).toBe('dark')
  })

  it('follows the OS when nothing is stored', () => {
    expect(resolveTheme(null, true)).toBe('light')
    expect(resolveTheme(null, false)).toBe('dark')
  })

  it('falls back to dark when the stored value is junk', () => {
    expect(resolveTheme('neon', false)).toBe('dark')
    expect(parseStoredTheme('neon')).toBeNull()
    expect(parseStoredTheme(null)).toBeNull()
  })

  it('toggles between exactly two themes', () => {
    expect(oppositeTheme('dark')).toBe('light')
    expect(oppositeTheme('light')).toBe('dark')
  })
})

describe('wrapIndex', () => {
  it('wraps in both directions', () => {
    expect(wrapIndex(2, 1, 3)).toBe(0)
    expect(wrapIndex(0, -1, 3)).toBe(2)
    expect(wrapIndex(0, 1, 3)).toBe(1)
  })

  it('stays at 0 for an empty list', () => {
    expect(wrapIndex(0, 1, 0)).toBe(0)
    expect(wrapIndex(5, -1, 0)).toBe(0)
  })
})

describe('date formatting', () => {
  it('formats months in UTC so timezones cannot shift them', () => {
    expect(formatMonth('2024-06')).toBe('Jun 2024')
    expect(formatMonth('2026-01')).toBe('Jan 2026')
  })

  it('formats full dates', () => {
    expect(formatDate('2025-01-07')).toBe('Jan 7, 2025')
  })

  it('renders an open-ended range as "present"', () => {
    expect(formatRange('2026-05', null)).toBe('May 2026 — present')
    expect(formatRange('2024-06', '2026-05')).toBe('Jun 2024 — May 2026')
  })

  it('emits machine-readable ranges for <time datetime>', () => {
    expect(machineRange('2026-05', null)).toBe('2026-05/..')
    expect(machineRange('2024-06', '2026-05')).toBe('2024-06/2026-05')
  })

  it('passes malformed input through untouched rather than rendering NaN', () => {
    expect(formatMonth('soon')).toBe('soon')
    expect(formatDate('2025-1-7')).toBe('2025-1-7')
  })
})
