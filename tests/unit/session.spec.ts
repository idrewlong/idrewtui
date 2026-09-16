import { describe, expect, it } from 'vitest'
import { formatUptime } from '../../app/composables/useSession'

describe('formatUptime', () => {
  it('pads to HH:MM:SS', () => {
    expect(formatUptime(0)).toBe('00:00:00')
    expect(formatUptime(5)).toBe('00:00:05')
    expect(formatUptime(65)).toBe('00:01:05')
    expect(formatUptime(3661)).toBe('01:01:01')
  })

  it('keeps counting past a day rather than wrapping', () => {
    expect(formatUptime(90000)).toBe('25:00:00')
  })

  it('floors fractional seconds', () => {
    expect(formatUptime(9.9)).toBe('00:00:09')
  })

  it('treats negative input as zero', () => {
    expect(formatUptime(-5)).toBe('00:00:00')
  })
})
