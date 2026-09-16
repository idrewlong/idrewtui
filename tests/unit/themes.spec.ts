import { describe, expect, it } from 'vitest'
import { generateThemes } from '../../scripts/generate-themes.mjs'

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const channels = [0, 2, 4].map(i => Number.parseInt(h.slice(i, i + 2), 16) / 255)
  const linear = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const themes = generateThemes()
const TEXT_TOKENS = ['fg', 'muted', 'accent', 'link', 'danger'] as const

describe('generated themes', () => {
  it('generates all ten themes named in the spec', () => {
    expect(themes.map(t => t.name).sort()).toEqual([
      'catppuccin', 'catppuccin-latte', 'everforest', 'gruvbox', 'kanagawa',
      'matte-black', 'osaka-jade', 'ristretto', 'rose-pine', 'tokyo-night',
    ])
  })

  it('defaults to tokyo-night being present and dark', () => {
    const tn = themes.find(t => t.name === 'tokyo-night')!
    expect(tn.mode).toBe('dark')
  })

  it('ships both a dark and a light option', () => {
    expect(themes.some(t => t.mode === 'dark')).toBe(true)
    expect(themes.some(t => t.mode === 'light')).toBe(true)
  })

  // The guard. Omarchy's palettes fail AA as-authored; the generator must fix them.
  it.each(themes.map(t => [t.name, t] as const))(
    '%s meets WCAG AA for every text token on both surfaces',
    (_name, theme) => {
      for (const token of TEXT_TOKENS) {
        expect(contrast(theme.tokens[token], theme.tokens.bg)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.tokens[token], theme.tokens.surface)).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  it.each(themes.map(t => [t.name, t] as const))(
    '%s keeps link visually distinct from accent',
    (_name, theme) => {
      expect(theme.tokens.link).not.toBe(theme.tokens.accent)
    },
  )

  it.each(themes.map(t => [t.name, t] as const))(
    '%s emits every token as a 6-digit hex colour',
    (_name, theme) => {
      for (const value of Object.values(theme.tokens)) {
        expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    },
  )
})
