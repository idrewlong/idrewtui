import { describe, expect, it } from 'vitest'
import { generateThemes, THEME_ORDER } from '../../scripts/generate-themes.mjs'
import {
  DEFAULT_DARK, DEFAULT_LIGHT, THEME_NAMES,
  nextTheme, parseStoredTheme, resolveTheme,
} from '../../app/composables/useTheme'
import { wrapIndex } from '../../app/composables/useSelection'
import { formatDate, formatMonth, formatRange, machineRange } from '../../app/utils/format'

describe('theme resolution', () => {
  it('lists tokyo-night first so it is the default and first in the cycle', () => {
    expect(THEME_NAMES[0]).toBe('tokyo-night')
    expect(DEFAULT_DARK).toBe('tokyo-night')
  })

  it('prefers a stored choice over the OS setting', () => {
    expect(resolveTheme('gruvbox', true)).toBe('gruvbox')
    expect(resolveTheme('kanagawa', false)).toBe('kanagawa')
  })

  it('follows the OS when nothing is stored', () => {
    expect(resolveTheme(null, true)).toBe(DEFAULT_LIGHT)
    expect(resolveTheme(null, false)).toBe(DEFAULT_DARK)
  })

  it('falls back when the stored value is not a theme we ship', () => {
    expect(resolveTheme('dracula', false)).toBe(DEFAULT_DARK)
    expect(parseStoredTheme('dracula')).toBeNull()
    expect(parseStoredTheme(null)).toBeNull()
    expect(parseStoredTheme('gruvbox')).toBe('gruvbox')
  })

  it('cycles through every theme and wraps', () => {
    const seen = new Set<string>()
    let current = THEME_NAMES[0]!
    for (let i = 0; i < THEME_NAMES.length; i++) {
      seen.add(current)
      current = nextTheme(current)
    }
    expect(seen.size).toBe(THEME_NAMES.length)
    expect(current).toBe(THEME_NAMES[0])
  })

  it('cycles from an unknown theme to the first rather than getting stuck', () => {
    expect(nextTheme('dracula')).toBe(THEME_NAMES[0])
  })

  it('stays in sync with the generator, which emits the CSS these names select', () => {
    expect([...THEME_NAMES]).toEqual(THEME_ORDER)
  })

  it('defaults match the first dark and first light theme the generator emits', () => {
    const generated = generateThemes()
    const firstDark = generated.find(t => t.mode === 'dark')!.name
    const firstLight = generated.find(t => t.mode === 'light')!.name
    expect(DEFAULT_DARK).toBe(firstDark)
    expect(DEFAULT_LIGHT).toBe(firstLight)
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
