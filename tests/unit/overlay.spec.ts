import { describe, expect, it } from 'vitest'
import { overlayModeLabel } from '../../app/utils/overlay'

describe('overlayModeLabel', () => {
  it('maps the TUI modes onto the status-line badge', () => {
    expect(overlayModeLabel('normal')).toBe('NORMAL')
    expect(overlayModeLabel('help')).toBe('NORMAL')
    expect(overlayModeLabel('palette')).toBe('COMMAND')
    expect(overlayModeLabel('find')).toBe('SEARCH')
    expect(overlayModeLabel('pager')).toBe('PAGER')
    expect(overlayModeLabel('compose')).toBe('MAIL')
  })
})
